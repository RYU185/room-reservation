import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { Search, Users, Calendar, Filter } from 'lucide-react'
import { getRooms } from '@/features/rooms/api/rooms.api'
import { getCalendar, createReservation } from '@/features/reservations/api/reservations.api'
import { useAuth } from '@/features/auth/context/AuthContext'
import type { Room } from '@/features/rooms/types'
import type { Reservation } from '@/features/reservations/types'
import TimeSlotGrid, { ALL_SLOTS } from '@/features/rooms/components/TimeSlotGrid'
import BookingModal from '@/features/reservations/components/BookingModal'
import Skeleton from '@/shared/components/Skeleton'

// ── Helpers ─────────────────────────────────────────────────────────────────

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addThirtyMin(time: string): string {
  const [h, m] = time.split(':').map(Number)
  if (m === 30) return `${String(h + 1).padStart(2, '0')}:00`
  return `${String(h).padStart(2, '0')}:30`
}

function computeSlots(
  reservations: Reservation[],
  date: string,
  userId: number,
): { bookedSlots: string[]; mySlots: string[] } {
  const booked: string[] = []
  const mine: string[] = []

  for (const slot of ALL_SLOTS) {
    const slotStart = new Date(`${date}T${slot}:00`)
    const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000)

    for (const res of reservations) {
      if (res.status === 'CANCELLED') continue
      const resStart = new Date(res.startTime)
      const resEnd = new Date(res.endTime)

      if (resStart < slotEnd && resEnd > slotStart) {
        if (res.user.id === userId) mine.push(slot)
        else booked.push(slot)
        break
      }
    }
  }

  return { bookedSlots: booked, mySlots: mine }
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${mo}.${day} (${days[d.getDay()]})`
}

// ── Component ────────────────────────────────────────────────────────────────

export default function RoomListPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [query, setQuery] = useState('')
  const [minCapacity, setMinCapacity] = useState('')

  const [rooms, setRooms] = useState<Room[]>([])
  const [roomsLoading, setRoomsLoading] = useState(true)
  const [roomsError, setRoomsError] = useState<string | null>(null)

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [selectedSlots, setSelectedSlots] = useState<string[]>([])

  const [calendarData, setCalendarData] = useState<Reservation[]>([])
  const [calendarLoading, setCalendarLoading] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // ── Fetch rooms ──────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false
    setRoomsLoading(true)
    setRoomsError(null)
    getRooms({ size: 50 })
      .then(({ rooms: data }) => { if (!cancelled) setRooms(data) })
      .catch(() => { if (!cancelled) setRoomsError('회의실 목록을 불러오는 데 실패했습니다.') })
      .finally(() => { if (!cancelled) setRoomsLoading(false) })
    return () => { cancelled = true }
  }, [])

  // ── Fetch calendar when room or month changes ────────────────────────────

  const fetchCalendar = useCallback(
    (roomId: number, date: string) => {
      const [year, month] = date.split('-').map(Number)
      let cancelled = false
      setCalendarLoading(true)
      getCalendar({ year, month, roomId })
        .then((data) => { if (!cancelled) setCalendarData(data) })
        .catch(() => { if (!cancelled) setCalendarData([]) })
        .finally(() => { if (!cancelled) setCalendarLoading(false) })
      return () => { cancelled = true }
    },
    [],
  )

  useEffect(() => {
    if (!selectedRoom) return
    return fetchCalendar(selectedRoom.id, selectedDate)
  }, [selectedRoom, selectedDate, fetchCalendar])

  // ── Derived slot states ──────────────────────────────────────────────────

  const { bookedSlots, mySlots } = user
    ? computeSlots(calendarData, selectedDate, user.id)
    : { bookedSlots: [], mySlots: [] }

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleRoomClick(room: Room) {
    if (!room.isActive) return
    setSelectedRoom((prev) => (prev?.id === room.id ? null : room))
    setSelectedSlots([])
    setCalendarData([])
  }

  function handleSlotToggle(slot: string) {
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot].sort(),
    )
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedDate(e.target.value)
    setSelectedSlots([])
  }

  async function handleConfirm(title: string, description: string) {
    if (!selectedRoom || selectedSlots.length === 0) return
    const sorted = [...selectedSlots].sort()
    const startTime = `${selectedDate}T${sorted[0]}:00`
    const endTime = `${selectedDate}T${addThirtyMin(sorted[sorted.length - 1])}:00`

    setModalLoading(true)
    setModalError(null)
    try {
      await createReservation({ roomId: selectedRoom.id, title, description, startTime, endTime })
      setShowModal(false)
      navigate('/', { state: { showConfirmation: true } })
    } catch {
      setModalError('예약에 실패했습니다. 다시 시도해 주세요.')
    } finally {
      setModalLoading(false)
    }
  }

  // ── Filtered rooms ────────────────────────────────────────────────────────

  const filtered = rooms.filter((r) => {
    const q = query.trim().toLowerCase()
    const cap = minCapacity ? Number(minCapacity) : 0
    const matchesQuery = !q || r.name.toLowerCase().includes(q) || r.location.toLowerCase().includes(q)
    const matchesCap = !cap || r.capacity >= cap
    return matchesQuery && matchesCap
  })

  return (
    <Wrapper>
      {/* ── Page header ── */}
      <PageHeader>
        <PageTitle>회의실 검색</PageTitle>
        <PageSubtitle>날짜와 시간을 선택해 회의실을 예약하세요</PageSubtitle>
      </PageHeader>

      {/* ── Search bar ── */}
      <SearchRow>
        <SearchWrapper>
          <SearchIcon>
            <Search size={14} color="#A0AEC0" strokeWidth={1.8} />
          </SearchIcon>
          <SearchInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="회의실 이름 또는 위치 검색"
          />
        </SearchWrapper>

        <CapacityWrapper>
          <Users size={14} color="#A0AEC0" strokeWidth={1.8} />
          <CapacityInput
            type="number"
            placeholder="최소 인원"
            min={1}
            value={minCapacity}
            onChange={(e) => setMinCapacity(e.target.value)}
          />
        </CapacityWrapper>

        <FilterButton type="button">
          <Filter size={14} color="#718096" strokeWidth={1.8} />
          필터
        </FilterButton>
      </SearchRow>

      {/* ── 2-column layout ── */}
      <Columns>
        {/* Left: room list */}
        <LeftColumn>
          <ColumnLabel>회의실 목록 ({filtered.length})</ColumnLabel>

          {roomsError && <ErrorText>{roomsError}</ErrorText>}

          {roomsLoading ? (
            <RoomCardList>
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i}>
                  <Skeleton height="12px" width="30%" />
                  <Skeleton height="16px" width="60%" />
                  <Skeleton height="12px" width="40%" />
                  <Skeleton height="22px" width="50%" />
                </SkeletonCard>
              ))}
            </RoomCardList>
          ) : filtered.length === 0 ? (
            <EmptyRooms>조건에 맞는 회의실이 없습니다.</EmptyRooms>
          ) : (
            <RoomCardList>
              {filtered.map((room) => (
                <RoomCard
                  key={room.id}
                  $selected={selectedRoom?.id === room.id}
                  $disabled={!room.isActive}
                  onClick={() => handleRoomClick(room)}
                >
                  <CardTop>
                    <FloorLabel>{room.location}</FloorLabel>
                    <StatusBadge $active={room.isActive}>
                      <StatusDot $active={room.isActive} />
                      {room.isActive ? '예약 가능' : '비활성'}
                    </StatusBadge>
                  </CardTop>

                  <RoomName>{room.name}</RoomName>

                  <CardMeta>
                    <Users size={12} color="#A0AEC0" strokeWidth={1.8} />
                    <span>최대 {room.capacity}인</span>
                  </CardMeta>

                  {room.amenities.length > 0 && (
                    <Amenities>
                      {room.amenities.slice(0, 3).map((a) => (
                        <AmenityTag key={a}>{a}</AmenityTag>
                      ))}
                      {room.amenities.length > 3 && (
                        <AmenityTag>+{room.amenities.length - 3}</AmenityTag>
                      )}
                    </Amenities>
                  )}
                </RoomCard>
              ))}
            </RoomCardList>
          )}
        </LeftColumn>

        {/* Right: slot panel */}
        <RightColumn>
          <SlotHeader>
            <ColumnLabel>
              {selectedRoom ? `시간 선택 — ${selectedRoom.name}` : '시간 선택'}
            </ColumnLabel>
            {selectedRoom && (
              <DateInput
                type="date"
                value={selectedDate}
                min={todayStr()}
                onChange={handleDateChange}
              />
            )}
          </SlotHeader>

          {selectedRoom ? (
            <>
              <SlotPanel>
                <DateLabel>
                  <Calendar size={13} color="#A0AEC0" strokeWidth={1.8} />
                  {formatDateDisplay(selectedDate)}
                </DateLabel>

                {calendarLoading ? (
                  <SlotSkeleton>
                    <Skeleton height="120px" />
                  </SlotSkeleton>
                ) : (
                  <TimeSlotGrid
                    bookedSlots={bookedSlots}
                    mySlots={mySlots}
                    selectedSlots={selectedSlots}
                    onToggle={handleSlotToggle}
                  />
                )}
              </SlotPanel>

              <ReserveButton
                disabled={selectedSlots.length === 0}
                onClick={() => setShowModal(true)}
              >
                {selectedSlots.length > 0
                  ? `${selectedSlots.length * 0.5}시간 예약하기`
                  : '시간을 선택하세요'}
              </ReserveButton>
            </>
          ) : (
            <EmptySlotPanel>
              <Calendar size={32} color="#CBD5E0" strokeWidth={1.5} />
              <EmptySlotTitle>회의실을 선택하세요</EmptySlotTitle>
              <EmptySlotSub>
                좌측에서 원하는 회의실을 클릭하면
                <br />
                시간을 선택할 수 있습니다.
              </EmptySlotSub>
            </EmptySlotPanel>
          )}
        </RightColumn>
      </Columns>

      {showModal && selectedRoom && (
        <BookingModal
          room={selectedRoom}
          date={selectedDate}
          selectedSlots={selectedSlots}
          loading={modalLoading}
          error={modalError}
          onClose={() => { setShowModal(false); setModalError(null) }}
          onConfirm={handleConfirm}
        />
      )}
    </Wrapper>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const PageHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-bottom: 4px;
  border-bottom: 1px solid #EDF2F7;
`

const PageTitle = styled.h1`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1B2E5E;
  letter-spacing: -0.3px;
`

const PageSubtitle = styled.p`
  margin: 0;
  font-size: 13px;
  color: #A0AEC0;
`

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`

const SearchRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
`

const SearchWrapper = styled.div`
  position: relative;
  flex: 1;
  min-width: 180px;
`

const SearchIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  display: flex;
  align-items: center;
`

const SearchInput = styled.input`
  width: 100%;
  padding: 9px 12px 9px 36px;
  border: 1px solid #CBD5E0;
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
  color: #2D3748;
  outline: none;
  box-sizing: border-box;
  transition: border-color 150ms ease, box-shadow 150ms ease;

  &::placeholder { color: #A0AEC0; }

  &:focus {
    border-color: #4299E1;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
  }
`

const CapacityWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  border: 1px solid #CBD5E0;
  border-radius: 6px;
  background: white;
  height: 38px;
  transition: border-color 150ms ease, box-shadow 150ms ease;

  &:focus-within {
    border-color: #4299E1;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
  }
`

const CapacityInput = styled.input`
  border: none;
  outline: none;
  font-size: 13px;
  font-family: inherit;
  color: #2D3748;
  width: 80px;
  background: transparent;

  &::placeholder { color: #A0AEC0; }
`

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  border: 1px solid #CBD5E0;
  border-radius: 6px;
  background: white;
  color: #718096;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.5s ease;

  &:hover {
    background: #EDF2F7;
  }
`

const Columns = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: start;
`

const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const ColumnLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #A0AEC0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  min-height: 32px;
  display: flex;
  align-items: center;
`

const RoomCardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const SkeletonCard = styled.div`
  background: white;
  border: 1.5px solid #E2E8F0;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const RoomCard = styled.div<{ $selected: boolean; $disabled: boolean }>`
  background: white;
  border: 1.5px solid ${({ $selected }) => ($selected ? '#4299E1' : '#E2E8F0')};
  border-radius: 8px;
  padding: 16px;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: ${({ $selected }) =>
    $selected
      ? '0 0 0 3px rgba(66,153,225,0.15)'
      : '0 1px 3px rgba(0,0,0,0.06)'};
  transition: all 200ms ease;
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};

  &:hover {
    box-shadow: ${({ $selected, $disabled }) =>
      $disabled
        ? '0 1px 3px rgba(0,0,0,0.06)'
        : $selected
        ? '0 0 0 3px rgba(66,153,225,0.15)'
        : '0 4px 6px rgba(0,0,0,0.07)'};
    border-color: ${({ $selected, $disabled }) =>
      $disabled ? '#E2E8F0' : $selected ? '#4299E1' : '#BEE3F8'};
  }
`

const CardTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
`

const FloorLabel = styled.span`
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #A0AEC0;
`

const RoomName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #2D3748;
`

const StatusBadge = styled.span<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  padding: 3px 9px;
  border-radius: 9999px;
  flex-shrink: 0;
  background: ${({ $active }) => ($active ? '#C6F6D5' : '#EDF2F7')};
  color: ${({ $active }) => ($active ? '#276749' : '#718096')};
`

const StatusDot = styled.span<{ $active: boolean }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ $active }) => ($active ? '#38A169' : '#A0AEC0')};
  flex-shrink: 0;
`

const CardMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #718096;
`

const Amenities = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`

const AmenityTag = styled.span`
  font-size: 11px;
  padding: 2px 8px;
  background: #EBF8FF;
  color: #2B6CB0;
  border: 1px solid #BEE3F8;
  border-radius: 9999px;
`

const EmptyRooms = styled.p`
  color: #A0AEC0;
  font-size: 13px;
  text-align: center;
  padding: 40px 0;
`

const ErrorText = styled.p`
  color: #E53E3E;
  font-size: 13px;
  margin: 0;
`

// ── Right panel ───────────────────────────────────────────────────────────────

const SlotHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  min-height: 32px;
`

const DateInput = styled.input`
  border: 1px solid #CBD5E0;
  border-radius: 6px;
  padding: 5px 8px;
  font-size: 12px;
  font-family: inherit;
  color: #2D3748;
  outline: none;
  cursor: pointer;
  transition: border-color 150ms ease, box-shadow 150ms ease;

  &:focus {
    border-color: #4299E1;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
  }
`

const SlotPanel = styled.div`
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const DateLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #A0AEC0;
`

const SlotSkeleton = styled.div`
  padding: 4px 0;
`

const ReserveButton = styled.button`
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 150ms ease;

  background: ${({ disabled }) => (disabled ? '#E2E8F0' : '#2C5282')};
  color: ${({ disabled }) => (disabled ? '#A0AEC0' : 'white')};
  cursor: ${({ disabled }) => (disabled ? 'default' : 'pointer')};

  &:hover:not(:disabled) {
    background: #23407A;
  }
`

const EmptySlotPanel = styled.div`
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  gap: 10px;
`

const EmptySlotTitle = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #A0AEC0;
`

const EmptySlotSub = styled.div`
  font-size: 12px;
  color: #CBD5E0;
  text-align: center;
  line-height: 1.6;
`

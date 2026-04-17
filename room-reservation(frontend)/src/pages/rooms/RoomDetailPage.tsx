import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { getRoom, checkAvailability } from '@/features/rooms/api/rooms.api'
import type { Room, RoomAvailabilityResponse } from '@/features/rooms/types'
import Skeleton from '@/shared/components/Skeleton'
import TimeRangePicker from '@/features/reservations/components/TimeRangePicker'

export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [availability, setAvailability] = useState<RoomAvailabilityResponse | null>(null)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !startTime || !endTime) {
      setAvailability(null)
      setAvailabilityError(null)
      return
    }

    let cancelled = false
    setCheckingAvailability(true)
    setAvailability(null)
    setAvailabilityError(null)

    checkAvailability(Number(id), startTime + ':00', endTime + ':00')
      .then((result) => { if (!cancelled) setAvailability(result) })
      .catch(() => { if (!cancelled) setAvailabilityError('가용성 확인에 실패했습니다.') })
      .finally(() => { if (!cancelled) setCheckingAvailability(false) })

    return () => { cancelled = true }
  }, [id, startTime, endTime])

  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function fetchRoom() {
      setLoading(true)
      setError(null)
      try {
        const data = await getRoom(Number(id))
        if (!cancelled) setRoom(data)
      } catch {
        if (!cancelled) setError('회의실 정보를 불러오는 데 실패했습니다.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchRoom()
    return () => { cancelled = true }
  }, [id])

  function handleReserve() {
    navigate(`/reservations/new?roomId=${id}&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`)
  }

  if (loading) return <LoadingSkeleton />
  if (error) return <ErrorMessage>{error}</ErrorMessage>
  if (!room) return null

  return (
    <Wrapper>
      <BackButton onClick={() => navigate(-1)}>← 목록으로</BackButton>

      <Card>
        <CardHeader>
          <div>
            <RoomName>{room.name}</RoomName>
            <MetaRow>
              <MetaItem>{room.location}</MetaItem>
              <MetaDot />
              <MetaItem>최대 {room.capacity}명</MetaItem>
            </MetaRow>
          </div>
          <StatusBadge $active={room.isActive}>
            {room.isActive ? '사용 가능' : '비활성'}
          </StatusBadge>
        </CardHeader>

        {room.description && <Description>{room.description}</Description>}

        {room.amenities.length > 0 && (
          <Section>
            <SectionTitle>시설</SectionTitle>
            <Amenities>
              {room.amenities.map((a) => (
                <AmenityTag key={a}>{a}</AmenityTag>
              ))}
            </Amenities>
          </Section>
        )}

        {room.isActive && (
          <Section>
            <SectionTitle>예약 시간 선택</SectionTitle>
            <TimeRangePicker
              startTime={startTime}
              endTime={endTime}
              onStartChange={setStartTime}
              onEndChange={setEndTime}
            />
            {checkingAvailability && <CheckingText>가용성 확인 중...</CheckingText>}

            {availabilityError && <InlineError>{availabilityError}</InlineError>}

            {availability && !availability.available && (
              <AvailabilityResult $available={false}>
                <ResultIcon>✕</ResultIcon>
                <div>
                  <span>해당 시간에 이미 예약이 있습니다.</span>
                  {availability.conflictingReservations.length > 0 && (
                    <ConflictList>
                      {availability.conflictingReservations.map((r) => (
                        <ConflictItem key={r.id}>
                          {r.title} ({r.startTime.slice(11, 16)} ~ {r.endTime.slice(11, 16)})
                        </ConflictItem>
                      ))}
                    </ConflictList>
                  )}
                </div>
              </AvailabilityResult>
            )}

            {availability?.available && (
              <AvailabilityResult $available={true}>
                <ResultIcon>✓</ResultIcon>
                <span>해당 시간에 예약 가능합니다.</span>
              </AvailabilityResult>
            )}

            <ReserveButton
              type="button"
              disabled={!availability?.available}
              onClick={handleReserve}
            >
              예약하기
            </ReserveButton>
          </Section>
        )}
      </Card>
    </Wrapper>
  )
}

function LoadingSkeleton() {
  return (
    <Wrapper>
      <Card>
        <Skeleton height="26px" width="40%" />
        <Skeleton height="14px" width="60%" />
        <Skeleton height="14px" width="50%" />
        <Skeleton height="100px" />
      </Card>
    </Wrapper>
  )
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 680px;
`

const BackButton = styled.button`
  background: none;
  border: none;
  color: #777777;
  font-size: 16px;
  cursor: pointer;
  padding: 0;
  width: fit-content;

  &:hover { color: #333333; }
`

const Card = styled.div`
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
`

const RoomName = styled.h1`
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 700;
  color: #111111;
  letter-spacing: -0.3px;
`

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`

const MetaItem = styled.span`
  font-size: 16px;
  color: #777777;
`

const MetaDot = styled.span`
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #cccccc;
  flex-shrink: 0;
`

const StatusBadge = styled.span<{ $active: boolean }>`
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 500;
  padding: 3px 9px;
  border-radius: 99px;
  background: ${({ $active }) => ($active ? '#f0fdf4' : '#f5f5f5')};
  color: ${({ $active }) => ($active ? '#15803d' : '#888888')};
`

const Description = styled.p`
  margin: 0;
  font-size: 16px;
  color: #555555;
  line-height: 1.6;
`

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
`

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #333333;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`

const Amenities = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
`

const AmenityTag = styled.span`
  font-size: 15px;
  padding: 3px 9px;
  background: #f5f5f5;
  color: #555555;
  border-radius: 5px;
`

const CheckingText = styled.p`
  margin: 0;
  font-size: 15px;
  color: #777777;
`

const AvailabilityResult = styled.div<{ $available: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 13px 15px;
  border-radius: 6px;
  background: ${({ $available }) => ($available ? '#f0fdf4' : '#fef2f2')};
  border: 1px solid ${({ $available }) => ($available ? '#bbf7d0' : '#fecaca')};
  color: ${({ $available }) => ($available ? '#15803d' : '#991b1b')};
  font-size: 16px;
`

const ResultIcon = styled.span`
  font-weight: 700;
  font-size: 17px;
  line-height: 1.4;
`

const ReserveButton = styled.button`
  align-self: flex-end;
  padding: 9px 22px;
  background: #111111;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.1s;

  &:hover:not(:disabled) { background: #000000; }

  &:disabled {
    background: #e5e5e5;
    color: #aaaaaa;
    cursor: not-allowed;
  }
`

const ConflictList = styled.ul`
  margin: 6px 0 0;
  padding-left: 16px;
`

const ConflictItem = styled.li`
  font-size: 15px;
  margin-top: 2px;
`

const InlineError = styled.p`
  margin: 0;
  font-size: 15px;
  color: #dc2626;
`

const ErrorMessage = styled.p`
  color: #dc2626;
  font-size: 16px;
`

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { getRoom, checkAvailability } from '@/features/rooms/api/rooms.api'
import type { Room, RoomAvailabilityResponse } from '@/features/rooms/types'
import Skeleton from '@/shared/components/Skeleton'

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

  async function handleCheckAvailability(e: React.FormEvent) {
    e.preventDefault()
    if (!id || !startTime || !endTime) return

    setCheckingAvailability(true)
    setAvailability(null)
    setAvailabilityError(null)

    try {
      const result = await checkAvailability(
        Number(id),
        new Date(startTime).toISOString(),
        new Date(endTime).toISOString(),
      )
      setAvailability(result)
    } catch {
      setAvailabilityError('가용성 확인에 실패했습니다.')
    } finally {
      setCheckingAvailability(false)
    }
  }

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
              <MetaItem>📍 {room.location}</MetaItem>
              <MetaItem>👥 최대 {room.capacity}명</MetaItem>
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
            <SectionTitle>가용성 확인</SectionTitle>
            <AvailabilityForm onSubmit={handleCheckAvailability}>
              <TimeField>
                <label>시작 시간</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => { setStartTime(e.target.value); setAvailability(null) }}
                  required
                />
              </TimeField>
              <TimeField>
                <label>종료 시간</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  min={startTime}
                  onChange={(e) => { setEndTime(e.target.value); setAvailability(null) }}
                  required
                />
              </TimeField>
              <CheckButton type="submit" disabled={checkingAvailability}>
                {checkingAvailability ? '확인 중...' : '가용성 확인'}
              </CheckButton>
            </AvailabilityForm>

            {availabilityError && <InlineError>{availabilityError}</InlineError>}

            {availability && (
              <AvailabilityResult $available={availability.available}>
                {availability.available ? (
                  <>
                    <ResultIcon>✓</ResultIcon>
                    <span>해당 시간에 예약 가능합니다.</span>
                    <ReserveButton type="button" onClick={handleReserve}>
                      예약하기
                    </ReserveButton>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </AvailabilityResult>
            )}
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
        <Skeleton height="28px" width="40%" />
        <Skeleton height="16px" width="60%" />
        <Skeleton height="16px" width="50%" />
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
  color: #64748b;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  width: fit-content;

  &:hover { color: #334155; }
`

const Card = styled.div`
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
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
  color: #1e293b;
`

const MetaRow = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
`

const MetaItem = styled.span`
  font-size: 14px;
  color: #64748b;
`

const StatusBadge = styled.span<{ $active: boolean }>`
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 99px;
  background: ${({ $active }) => ($active ? '#dcfce7' : '#f1f5f9')};
  color: ${({ $active }) => ($active ? '#166534' : '#64748b')};
`

const Description = styled.p`
  margin: 0;
  font-size: 14px;
  color: #475569;
  line-height: 1.6;
`

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #f1f5f9;
`

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
`

const Amenities = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const AmenityTag = styled.span`
  font-size: 13px;
  padding: 4px 10px;
  background: #eff6ff;
  color: #3b82f6;
  border-radius: 6px;
`

const AvailabilityForm = styled.form`
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
`

const TimeField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  label {
    font-size: 12px;
    color: #64748b;
    font-weight: 500;
  }

  input {
    padding: 8px 10px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 13px;
    color: #334155;
    outline: none;

    &:focus { border-color: #2563eb; }
  }
`

const CheckButton = styled.button`
  padding: 8px 16px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #334155;
  cursor: pointer;
  height: 36px;

  &:hover:not(:disabled) { background: #e2e8f0; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

const AvailabilityResult = styled.div<{ $available: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 8px;
  background: ${({ $available }) => ($available ? '#f0fdf4' : '#fef2f2')};
  border: 1px solid ${({ $available }) => ($available ? '#bbf7d0' : '#fecaca')};
  color: ${({ $available }) => ($available ? '#166534' : '#991b1b')};
  font-size: 14px;
`

const ResultIcon = styled.span`
  font-weight: 700;
  font-size: 16px;
  line-height: 1.4;
`

const ReserveButton = styled.button`
  margin-left: auto;
  padding: 8px 20px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;

  &:hover { background: #1d4ed8; }
`

const ConflictList = styled.ul`
  margin: 6px 0 0;
  padding-left: 16px;
`

const ConflictItem = styled.li`
  font-size: 13px;
  margin-top: 2px;
`

const InlineError = styled.p`
  margin: 0;
  font-size: 13px;
  color: #dc2626;
`

const ErrorMessage = styled.p`
  color: #dc2626;
  font-size: 14px;
`

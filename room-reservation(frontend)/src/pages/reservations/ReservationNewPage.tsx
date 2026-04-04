import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { getRoom } from '@/features/rooms/api/rooms.api'
import { createReservation } from '@/features/reservations/api/reservations.api'
import ReservationForm from '@/features/reservations/components/ReservationForm'
import type { ReservationFormValues } from '@/features/reservations/components/ReservationForm'
import type { Room } from '@/features/rooms/types'
import type { AxiosError } from 'axios'
import type { ErrorResponse } from '@/shared/types'
import { getErrorMessage } from '@/shared/utils/errorMessage'
import Skeleton from '@/shared/components/Skeleton'

export default function ReservationNewPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const roomId = Number(searchParams.get('roomId'))
  const startTimeParam = searchParams.get('startTime') ?? ''
  const endTimeParam = searchParams.get('endTime') ?? ''

  const [room, setRoom] = useState<Room | null>(null)
  const [roomLoading, setRoomLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  useEffect(() => {
    if (!roomId) return
    let cancelled = false
    setRoomLoading(true)
    getRoom(roomId)
      .then((data) => {
        if (!cancelled) setRoom(data)
      })
      .catch(() => {
        if (!cancelled) setRoom(null)
      })
      .finally(() => {
        if (!cancelled) setRoomLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [roomId])

  async function  (values: ReservationFormValues) {
    if (!roomId) return
    setSubmitLoading(true)
    setServerError(null)
    try {
      const reservation = await createReservation({
        roomId,
        title: values.title,
        description: values.description,
        startTime: values.startTime + ':00',
        endTime: values.endTime + ':00',
      })
      navigate(`/reservations/${reservation.id}`, { replace: true })
    } catch (err) {
      const code = (err as AxiosError<ErrorResponse>).response?.data?.code ?? 'INTERNAL_ERROR'
      setServerError(getErrorMessage(code))
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <Wrapper>
      <BackButton onClick={() => navigate(-1)}>← 뒤로가기</BackButton>

      <Card>
        <PageTitle>예약 만들기</PageTitle>

        <RoomInfoBox>
          {roomLoading ? (
            <>
              <Skeleton height="16px" width="40%" />
              <Skeleton height="14px" width="60%" />
            </>
          ) : room ? (
            <>
              <RoomName>{room.name}</RoomName>
              <RoomMeta>📍 {room.location} · 👥 최대 {room.capacity}명</RoomMeta>
            </>
          ) : (
            <RoomError>회의실 정보를 불러올 수 없습니다.</RoomError>
          )}
        </RoomInfoBox>

        <ReservationForm
          defaultValues={{
            startTime: startTimeParam ? startTimeParam.slice(0, 16) : '',
            endTime: endTimeParam ? endTimeParam.slice(0, 16) : '',
          }}
          onSubmit={handleSubmit}
          loading={submitLoading}
          serverError={serverError}
          submitLabel="예약하기"
        />
      </Card>
    </Wrapper>
  )
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 560px;
`

const BackButton = styled.button`
  background: none;
  border: none;
  color: #64748b;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  width: fit-content;

  &:hover {
    color: #334155;
  }
`

const Card = styled.div`
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`

const PageTitle = styled.h1`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
`

const RoomInfoBox = styled.div`
  padding: 14px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const RoomName = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
`

const RoomMeta = styled.span`
  font-size: 13px;
  color: #64748b;
`

const RoomError = styled.span`
  font-size: 13px;
  color: #dc2626;
`

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { useReservation } from '@/features/reservations/hooks/useReservation'
import {
  updateReservation,
  cancelReservation,
} from '@/features/reservations/api/reservations.api'
import ReservationForm from '@/features/reservations/components/ReservationForm'
import type { ReservationFormValues } from '@/features/reservations/components/ReservationForm'
import { Button } from '@/shared/components'
import Skeleton from '@/shared/components/Skeleton'
import { formatDisplay, formatTime } from '@/shared/utils/date'
import { getErrorMessage } from '@/shared/utils/errorMessage'
import type { AxiosError } from 'axios'
import type { ErrorResponse } from '@/shared/types'

export default function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { reservation, setReservation, loading, error } = useReservation(Number(id))

  const [isEditing, setIsEditing] = useState(false)
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleUpdate(values: ReservationFormValues) {
    if (!reservation) return
    setActionLoading(true)
    setActionError(null)
    try {
      const updated = await updateReservation(reservation.id, {
        title: values.title,
        description: values.description,
        startTime: values.startTime + ':00',
        endTime: values.endTime + ':00',
      })
      setReservation(updated)
      setIsEditing(false)
    } catch (err) {
      const code = (err as AxiosError<ErrorResponse>).response?.data?.code ?? 'INTERNAL_ERROR'
      setActionError(getErrorMessage(code))
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCancel() {
    if (!reservation) return
    setActionLoading(true)
    setActionError(null)
    try {
      await cancelReservation(reservation.id)
      setReservation({ ...reservation, status: 'CANCELLED' })
      setCancelConfirm(false)
    } catch (err) {
      const code = (err as AxiosError<ErrorResponse>).response?.data?.code ?? 'INTERNAL_ERROR'
      setActionError(getErrorMessage(code))
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <Wrapper>
        <Card>
          <Skeleton height="20px" width="40%" />
          <Skeleton height="14px" width="60%" />
          <Skeleton height="14px" width="50%" />
          <Skeleton height="80px" />
        </Card>
      </Wrapper>
    )
  }

  if (error || !reservation) {
    return (
      <Wrapper>
        <ErrorMessage>{error ?? '예약을 찾을 수 없습니다.'}</ErrorMessage>
      </Wrapper>
    )
  }

  const isConfirmed = reservation.status === 'CONFIRMED'

  return (
    <Wrapper>
      <BackButton onClick={() => navigate('/reservations/my')}>← 내 예약</BackButton>

      <Card>
        <CardHeader>
          <TitleArea>
            <ReservationTitle>{reservation.title}</ReservationTitle>
            <StatusBadge $confirmed={isConfirmed}>
              {isConfirmed ? '예약 확정' : '취소됨'}
            </StatusBadge>
          </TitleArea>
        </CardHeader>

        <InfoSection>
          <InfoRow>
            <InfoLabel>예약자</InfoLabel>
            <InfoValue>{reservation.user.name} ({reservation.user.email})</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>회의실</InfoLabel>
            <InfoValue>{reservation.room.name} · {reservation.room.location}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>시간</InfoLabel>
            <InfoValue>
              {formatDisplay(reservation.startTime)} ~ {formatTime(reservation.endTime)}
            </InfoValue>
          </InfoRow>
          {reservation.description && (
            <InfoRow>
              <InfoLabel>설명</InfoLabel>
              <InfoValue>{reservation.description}</InfoValue>
            </InfoRow>
          )}
        </InfoSection>

        {isConfirmed && !isEditing && (
          <ActionArea>
            {actionError && <ActionError>{actionError}</ActionError>}

            {cancelConfirm ? (
              <CancelConfirm>
                <CancelMessage>예약을 취소하시겠습니까?</CancelMessage>
                <CancelButtons>
                  <Button
                    variant="danger"
                    size="sm"
                    loading={actionLoading}
                    onClick={handleCancel}
                  >
                    확인
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => { setCancelConfirm(false); setActionError(null) }}
                  >
                    닫기
                  </Button>
                </CancelButtons>
              </CancelConfirm>
            ) : (
              <Buttons>
                <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                  수정
                </Button>
                <Button variant="danger" size="sm" onClick={() => setCancelConfirm(true)}>
                  예약 취소
                </Button>
              </Buttons>
            )}
          </ActionArea>
        )}

        {isEditing && (
          <EditSection>
            <EditTitle>예약 수정</EditTitle>
            <ReservationForm
              defaultValues={{
                title: reservation.title,
                description: reservation.description,
                startTime: reservation.startTime.slice(0, 16),
                endTime: reservation.endTime.slice(0, 16),
              }}
              onSubmit={handleUpdate}
              loading={actionLoading}
              serverError={actionError}
              submitLabel="저장"
            />
            <CancelEditButton
              onClick={() => { setIsEditing(false); setActionError(null) }}
            >
              취소
            </CancelEditButton>
          </EditSection>
        )}
      </Card>
    </Wrapper>
  )
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 640px;
`

const BackButton = styled.button`
  background: none;
  border: none;
  color: #777777;
  font-size: 16px;
  cursor: pointer;
  padding: 0;
  width: fit-content;

  &:hover {
    color: #333333;
  }
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

const CardHeader = styled.div``

const TitleArea = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`

const ReservationTitle = styled.h1`
  margin: 0;
  font-size: 19px;
  font-weight: 700;
  color: #111111;
  letter-spacing: -0.3px;
`

const StatusBadge = styled.span<{ $confirmed: boolean }>`
  font-size: 14px;
  font-weight: 500;
  padding: 3px 9px;
  border-radius: 99px;
  background: ${({ $confirmed }) => ($confirmed ? '#f0fdf4' : '#f5f5f5')};
  color: ${({ $confirmed }) => ($confirmed ? '#15803d' : '#888888')};
`

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  background: #fafafa;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
`

const InfoRow = styled.div`
  display: flex;
  gap: 12px;
`

const InfoLabel = styled.span`
  font-size: 15px;
  font-weight: 500;
  color: #888888;
  min-width: 56px;
`

const InfoValue = styled.span`
  font-size: 15px;
  color: #333333;
`

const ActionArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 4px;
  border-top: 1px solid #f0f0f0;
`

const Buttons = styled.div`
  display: flex;
  gap: 8px;
`

const ActionError = styled.p`
  margin: 0;
  font-size: 15px;
  color: #dc2626;
`

const CancelConfirm = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 13px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
`

const CancelMessage = styled.span`
  font-size: 15px;
  color: #991b1b;
  flex: 1;
`

const CancelButtons = styled.div`
  display: flex;
  gap: 6px;
`

const EditSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 4px;
  border-top: 1px solid #f0f0f0;
`

const EditTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333333;
`

const CancelEditButton = styled.button`
  background: none;
  border: none;
  font-size: 15px;
  color: #777777;
  cursor: pointer;
  padding: 0;
  width: fit-content;

  &:hover {
    color: #333333;
  }
`

const ErrorMessage = styled.p`
  color: #dc2626;
  font-size: 16px;
`

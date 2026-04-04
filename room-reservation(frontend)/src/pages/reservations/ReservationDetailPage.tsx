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
          <Skeleton height="22px" width="40%" />
          <Skeleton height="16px" width="60%" />
          <Skeleton height="16px" width="50%" />
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
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
`

const StatusBadge = styled.span<{ $confirmed: boolean }>`
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 99px;
  background: ${({ $confirmed }) => ($confirmed ? '#dcfce7' : '#f1f5f9')};
  color: ${({ $confirmed }) => ($confirmed ? '#166534' : '#64748b')};
`

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
`

const InfoRow = styled.div`
  display: flex;
  gap: 12px;
`

const InfoLabel = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  min-width: 60px;
`

const InfoValue = styled.span`
  font-size: 13px;
  color: #334155;
`

const ActionArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 4px;
  border-top: 1px solid #f1f5f9;
`

const Buttons = styled.div`
  display: flex;
  gap: 8px;
`

const ActionError = styled.p`
  margin: 0;
  font-size: 13px;
  color: #dc2626;
`

const CancelConfirm = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
`

const CancelMessage = styled.span`
  font-size: 13px;
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
  border-top: 1px solid #f1f5f9;
`

const EditTitle = styled.h3`
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #334155;
`

const CancelEditButton = styled.button`
  background: none;
  border: none;
  font-size: 13px;
  color: #64748b;
  cursor: pointer;
  padding: 0;
  width: fit-content;

  &:hover {
    color: #334155;
  }
`

const ErrorMessage = styled.p`
  color: #dc2626;
  font-size: 14px;
`

import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { getUserReservations } from '@/features/admin/api/admin.api'
import type { AdminUser } from '@/features/admin/types'
import type { Reservation } from '@/features/reservations/types'
import type { PageMeta } from '@/shared/types'
import Skeleton from '@/shared/components/Skeleton'
import Pagination from '@/shared/components/Pagination'
import { formatDisplay, formatTime } from '@/shared/utils/date'

const PAGE_SIZE = 8

interface Props {
  user: AdminUser
  onClose: () => void
}

export default function UserReservationsModal({ user, onClose }: Props) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [meta, setMeta] = useState<PageMeta | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getUserReservations(user.id, { page, size: PAGE_SIZE })
      .then((result) => {
        if (!cancelled) {
          setReservations(result.reservations)
          setMeta(result.meta)
        }
      })
      .catch(() => {
        if (!cancelled) setError('예약 이력을 불러오는 데 실패했습니다.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [user.id, page])

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <div>
            <ModalTitle>{user.name}의 예약 이력</ModalTitle>
            <ModalSub>{user.email}</ModalSub>
          </div>
          <CloseButton onClick={onClose}>✕</CloseButton>
        </ModalHeader>

        <ModalBody>
          {error && <ErrorMessage>{error}</ErrorMessage>}

          {loading ? (
            <SkeletonList>
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonRow key={i}>
                  <Skeleton height="13px" width="40%" />
                  <Skeleton height="12px" width="60%" />
                </SkeletonRow>
              ))}
            </SkeletonList>
          ) : reservations.length === 0 ? (
            <Empty>예약 이력이 없습니다.</Empty>
          ) : (
            <ReservationList>
              {reservations.map((r) => (
                <ReservationRow key={r.id}>
                  <RowLeft>
                    <ResTitle>{r.title}</ResTitle>
                    <ResMeta>
                      {r.room.name} · {r.room.location}
                    </ResMeta>
                    <ResMeta>
                      {formatDisplay(r.startTime)} ~ {formatTime(r.endTime)}
                    </ResMeta>
                  </RowLeft>
                  <StatusBadge $confirmed={r.status === 'CONFIRMED'}>
                    {r.status === 'CONFIRMED' ? '확정' : '취소'}
                  </StatusBadge>
                </ReservationRow>
              ))}
            </ReservationList>
          )}

          {meta && meta.totalPages > 1 && (
            <PaginationWrapper>
              <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />
            </PaginationWrapper>
          )}
        </ModalBody>
      </Modal>
    </Overlay>
  )
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`

const Modal = styled.div`
  background: #fff;
  border-radius: 8px;
  width: 560px;
  max-width: 90vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
`

const ModalHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 18px 22px 14px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
`

const ModalTitle = styled.h2`
  margin: 0 0 2px;
  font-size: 18px;
  font-weight: 700;
  color: #111111;
  letter-spacing: -0.2px;
`

const ModalSub = styled.p`
  margin: 0;
  font-size: 14px;
  color: #aaaaaa;
`

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 17px;
  color: #aaaaaa;
  cursor: pointer;
  padding: 4px;
  line-height: 1;

  &:hover {
    color: #333333;
  }
`

const ModalBody = styled.div`
  padding: 14px 22px 18px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const SkeletonList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const SkeletonRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 11px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
`

const Empty = styled.p`
  text-align: center;
  color: #aaaaaa;
  font-size: 16px;
  padding: 32px 0;
  margin: 0;
`

const ReservationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
`

const ReservationRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 13px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  transition: border-color 0.1s;

  &:hover {
    border-color: #e5e5e5;
  }
`

const RowLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`

const ResTitle = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: #111111;
`

const ResMeta = styled.span`
  font-size: 14px;
  color: #aaaaaa;
`

const StatusBadge = styled.span<{ $confirmed: boolean }>`
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 500;
  padding: 2px 7px;
  border-radius: 99px;
  background: ${({ $confirmed }) => ($confirmed ? '#f0fdf4' : '#f5f5f5')};
  color: ${({ $confirmed }) => ($confirmed ? '#15803d' : '#aaaaaa')};
`

const ErrorMessage = styled.p`
  margin: 0;
  font-size: 15px;
  color: #dc2626;
`

const PaginationWrapper = styled.div`
  padding-top: 4px;
`

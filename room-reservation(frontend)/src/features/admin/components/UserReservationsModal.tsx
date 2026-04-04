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
                  <Skeleton height="14px" width="40%" />
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
  border-radius: 12px;
  width: 560px;
  max-width: 90vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
`

const ModalHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f1f5f9;
  flex-shrink: 0;
`

const ModalTitle = styled.h2`
  margin: 0 0 2px;
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
`

const ModalSub = styled.p`
  margin: 0;
  font-size: 12px;
  color: #94a3b8;
`

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 16px;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  line-height: 1;

  &:hover {
    color: #334155;
  }
`

const ModalBody = styled.div`
  padding: 16px 24px 20px;
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
  padding: 12px;
  border: 1px solid #f1f5f9;
  border-radius: 8px;
`

const Empty = styled.p`
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
  padding: 32px 0;
  margin: 0;
`

const ReservationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const ReservationRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid #f1f5f9;
  border-radius: 8px;
`

const RowLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`

const ResTitle = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
`

const ResMeta = styled.span`
  font-size: 12px;
  color: #94a3b8;
`

const StatusBadge = styled.span<{ $confirmed: boolean }>`
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 99px;
  background: ${({ $confirmed }) => ($confirmed ? '#dcfce7' : '#f1f5f9')};
  color: ${({ $confirmed }) => ($confirmed ? '#166534' : '#94a3b8')};
`

const ErrorMessage = styled.p`
  margin: 0;
  font-size: 13px;
  color: #dc2626;
`

const PaginationWrapper = styled.div`
  padding-top: 4px;
`

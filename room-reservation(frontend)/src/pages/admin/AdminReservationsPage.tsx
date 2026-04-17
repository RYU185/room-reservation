import { useState, useEffect, useCallback } from 'react'
import styled from 'styled-components'
import { getAdminReservations, cancelAdminReservation } from '@/features/admin/api/admin.api'
import type { AdminReservation, AdminReservationFilters } from '@/features/admin/types'
import type { ReservationStatus } from '@/features/reservations/types'
import type { PageMeta } from '@/shared/types'
import Skeleton from '@/shared/components/Skeleton'
import Pagination from '@/shared/components/Pagination'
import { formatDisplay, formatTime } from '@/shared/utils/date'

type StatusFilter = 'ALL' | ReservationStatus

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: '전체', value: 'ALL' },
  { label: '예약 확정', value: 'CONFIRMED' },
  { label: '취소됨', value: 'CANCELLED' },
]

const PAGE_SIZE = 15

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<AdminReservation[]>([])
  const [meta, setMeta] = useState<PageMeta | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [roomIdInput, setRoomIdInput] = useState('')
  const [userIdInput, setUserIdInput] = useState('')

  const [cancelTarget, setCancelTarget] = useState<AdminReservation | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  const fetchReservations = useCallback(async () => {
    setLoading(true)
    setError(null)
    const filters: AdminReservationFilters = {
      page,
      size: PAGE_SIZE,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      from: from || undefined,
      to: to || undefined,
      roomId: roomIdInput ? Number(roomIdInput) : undefined,
      userId: userIdInput ? Number(userIdInput) : undefined,
    }
    try {
      const result = await getAdminReservations(filters)
      setReservations(result.reservations)
      setMeta(result.meta)
    } catch {
      setError('예약 목록을 불러오는 데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, from, to, roomIdInput, userIdInput])

  useEffect(() => {
    fetchReservations()
  }, [fetchReservations])

  function handleStatusChange(value: StatusFilter) {
    setStatusFilter(value)
    setPage(1)
  }

  async function handleCancel() {
    if (!cancelTarget) return
    setCancelling(true)
    setCancelError(null)
    try {
      await cancelAdminReservation(cancelTarget.id)
      setReservations((prev) =>
        prev.map((r) => (r.id === cancelTarget.id ? { ...r, status: 'CANCELLED' } : r)),
      )
      setCancelTarget(null)
    } catch {
      setCancelError('취소에 실패했습니다.')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <Wrapper>
      <PageHeader>
        <PageTitle>예약 관리</PageTitle>
      </PageHeader>

      <FilterArea>
        <TabGroup>
          {STATUS_TABS.map((tab) => (
            <TabButton
              key={tab.value}
              $active={statusFilter === tab.value}
              onClick={() => handleStatusChange(tab.value)}
            >
              {tab.label}
            </TabButton>
          ))}
        </TabGroup>

        <FilterRow>
          <DateInput
            type="date"
            value={from}
            onChange={(e) => { setFrom(e.target.value); setPage(1) }}
          />
          <DateSep>–</DateSep>
          <DateInput
            type="date"
            value={to}
            min={from}
            onChange={(e) => { setTo(e.target.value); setPage(1) }}
          />
          <NumberInput
            type="number"
            placeholder="회의실 ID"
            value={roomIdInput}
            onChange={(e) => { setRoomIdInput(e.target.value); setPage(1) }}
          />
          <NumberInput
            type="number"
            placeholder="사용자 ID"
            value={userIdInput}
            onChange={(e) => { setUserIdInput(e.target.value); setPage(1) }}
          />
        </FilterRow>
      </FilterArea>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <TableCard>
        <Table>
          <thead>
            <tr>
              <Th>제목</Th>
              <Th>회의실</Th>
              <Th>예약자</Th>
              <Th>시간</Th>
              <Th>상태</Th>
              <Th>액션</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <Td key={j}>
                      <Skeleton height="14px" width="80%" />
                    </Td>
                  ))}
                </tr>
              ))
            ) : reservations.length === 0 ? (
              <tr>
                <EmptyTd colSpan={6}>조건에 맞는 예약이 없습니다.</EmptyTd>
              </tr>
            ) : (
              reservations.map((r) => (
                <tr key={r.id}>
                  <Td>
                    <TitleText>{r.title}</TitleText>
                  </Td>
                  <Td>
                    <RoomText>{r.room.name}</RoomText>
                    <SubInfo>{r.room.location}</SubInfo>
                  </Td>
                  <Td>
                    <UserText>{r.user.name}</UserText>
                    <SubInfo>{r.user.email}</SubInfo>
                  </Td>
                  <Td>
                    <TimeText>
                      {formatDisplay(r.startTime)} ~ {formatTime(r.endTime)}
                    </TimeText>
                  </Td>
                  <Td>
                    <StatusBadge $confirmed={r.status === 'CONFIRMED'}>
                      {r.status === 'CONFIRMED' ? '예약 확정' : '취소됨'}
                    </StatusBadge>
                  </Td>
                  <Td>
                    {r.status === 'CONFIRMED' && (
                      <CancelBtn onClick={() => { setCancelTarget(r); setCancelError(null) }}>
                        강제 취소
                      </CancelBtn>
                    )}
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </TableCard>

      {meta && meta.totalPages > 1 && (
        <PaginationWrapper>
          <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />
        </PaginationWrapper>
      )}

      {cancelTarget && (
        <ConfirmOverlay onClick={() => setCancelTarget(null)}>
          <ConfirmBox onClick={(e) => e.stopPropagation()}>
            <ConfirmText>
              <strong>{cancelTarget.title}</strong> 예약을 강제 취소하시겠습니까?
              <br />
              <SubText>예약자: {cancelTarget.user.name} ({cancelTarget.user.email})</SubText>
            </ConfirmText>
            {cancelError && <ConfirmError>{cancelError}</ConfirmError>}
            <ConfirmActions>
              <DangerButton onClick={handleCancel} disabled={cancelling}>
                {cancelling ? '처리 중...' : '강제 취소'}
              </DangerButton>
              <CancelConfirmButton onClick={() => setCancelTarget(null)}>
                닫기
              </CancelConfirmButton>
            </ConfirmActions>
          </ConfirmBox>
        </ConfirmOverlay>
      )}
    </Wrapper>
  )
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const PageHeader = styled.div``

const PageTitle = styled.h1`
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #111111;
  letter-spacing: -0.3px;
`

const FilterArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const TabGroup = styled.div`
  display: flex;
  gap: 4px;
`

const TabButton = styled.button<{ $active: boolean }>`
  padding: 5px 12px;
  border-radius: 5px;
  border: 1px solid ${({ $active }) => ($active ? '#111111' : '#e5e5e5')};
  background: ${({ $active }) => ($active ? '#111111' : '#fff')};
  color: ${({ $active }) => ($active ? '#fff' : '#777777')};
  font-size: 15px;
  font-weight: ${({ $active }) => ($active ? '500' : '400')};
  cursor: pointer;
  transition: all 0.1s;

  &:hover {
    border-color: #333333;
    color: ${({ $active }) => ($active ? '#fff' : '#333333')};
  }
`

const FilterRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`

const DateInput = styled.input`
  padding: 5px 9px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 15px;
  color: #333333;
  outline: none;

  &:focus {
    border-color: #111111;
  }
`

const DateSep = styled.span`
  font-size: 15px;
  color: #aaaaaa;
`

const NumberInput = styled.input`
  padding: 5px 9px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 15px;
  color: #333333;
  width: 110px;
  outline: none;

  &:focus {
    border-color: #111111;
  }
`

const TableCard = styled.div`
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  overflow: hidden;
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`

const Th = styled.th`
  padding: 11px 16px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: #888888;
  background: #fafafa;
  border-bottom: 1px solid #e5e5e5;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`

const Td = styled.td`
  padding: 12px 16px;
  font-size: 16px;
  color: #333333;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: middle;
`

const EmptyTd = styled.td`
  padding: 48px 16px;
  text-align: center;
  font-size: 16px;
  color: #aaaaaa;
`

const TitleText = styled.span`
  font-weight: 500;
  color: #111111;
`

const RoomText = styled.div`
  font-weight: 500;
  color: #111111;
`

const UserText = styled.div`
  font-weight: 500;
  color: #111111;
`

const SubInfo = styled.div`
  font-size: 14px;
  color: #aaaaaa;
  margin-top: 2px;
`

const TimeText = styled.span`
  font-size: 15px;
  white-space: nowrap;
`

const StatusBadge = styled.span<{ $confirmed: boolean }>`
  font-size: 13px;
  font-weight: 500;
  padding: 2px 7px;
  border-radius: 99px;
  background: ${({ $confirmed }) => ($confirmed ? '#f0fdf4' : '#f5f5f5')};
  color: ${({ $confirmed }) => ($confirmed ? '#15803d' : '#aaaaaa')};
  white-space: nowrap;
`

const CancelBtn = styled.button`
  padding: 4px 10px;
  font-size: 14px;
  border-radius: 5px;
  cursor: pointer;
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #dc2626;

  &:hover {
    background: #fee2e2;
  }
`

const ErrorMessage = styled.p`
  margin: 0;
  font-size: 16px;
  color: #dc2626;
`

const PaginationWrapper = styled.div`
  padding-top: 4px;
`

const ConfirmOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`

const ConfirmBox = styled.div`
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  width: 380px;
  max-width: 90vw;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
`

const ConfirmText = styled.p`
  margin: 0;
  font-size: 16px;
  color: #333333;
  line-height: 1.6;
`

const SubText = styled.span`
  font-size: 15px;
  color: #aaaaaa;
`

const ConfirmError = styled.p`
  margin: 0;
  font-size: 15px;
  color: #dc2626;
`

const ConfirmActions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`

const DangerButton = styled.button`
  padding: 7px 14px;
  background: #dc2626;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #b91c1c;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const CancelConfirmButton = styled.button`
  padding: 7px 14px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 15px;
  color: #777777;
  cursor: pointer;

  &:hover {
    background: #f5f5f5;
  }
`

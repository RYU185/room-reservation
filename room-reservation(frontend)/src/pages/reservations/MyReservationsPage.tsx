import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { useMyReservations } from '@/features/reservations/hooks/useMyReservations'
import ReservationCard from '@/features/reservations/components/ReservationCard'
import Pagination from '@/shared/components/Pagination'
import Skeleton from '@/shared/components/Skeleton'
import type { ReservationStatus } from '@/features/reservations/types'

type StatusFilter = 'ALL' | ReservationStatus

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: '전체', value: 'ALL' },
  { label: '예약 확정', value: 'CONFIRMED' },
  { label: '취소됨', value: 'CANCELLED' },
]

const PAGE_SIZE = 10

export default function MyReservationsPage() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)

  const { reservations, meta, loading, error } = useMyReservations({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    from: from || undefined,
    to: to || undefined,
    page,
    size: PAGE_SIZE,
  })

  function handleStatusChange(value: StatusFilter) {
    setStatusFilter(value)
    setPage(1)
  }

  function handleFromChange(value: string) {
    setFrom(value)
    setPage(1)
  }

  function handleToChange(value: string) {
    setTo(value)
    setPage(1)
  }

  return (
    <Wrapper>
      <FilterRow>
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

        <DateRange>
          <DateInput
            type="date"
            value={from}
            onChange={(e) => handleFromChange(e.target.value)}
          />
          <DateSep>–</DateSep>
          <DateInput
            type="date"
            value={to}
            min={from}
            onChange={(e) => handleToChange(e.target.value)}
          />
        </DateRange>
      </FilterRow>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {loading ? (
        <List>
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i}>
              <Skeleton height="17px" width="50%" />
              <Skeleton height="13px" width="40%" />
              <Skeleton height="13px" width="60%" />
            </SkeletonCard>
          ))}
        </List>
      ) : reservations.length === 0 ? (
        <Empty>예약 내역이 없습니다.</Empty>
      ) : (
        <List>
          {reservations.map((r) => (
            <ReservationCard
              key={r.id}
              reservation={r}
              onClick={() => navigate(`/reservations/${r.id}`)}
            />
          ))}
        </List>
      )}

      {meta && meta.totalPages > 1 && (
        <PaginationWrapper>
          <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />
        </PaginationWrapper>
      )}
    </Wrapper>
  )
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const FilterRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`

const TabGroup = styled.div`
  display: flex;
  gap: 6px;
`

const TabButton = styled.button<{ $active: boolean }>`
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid ${({ $active }) => ($active ? '#2C5282' : '#E2E8F0')};
  background: ${({ $active }) => ($active ? '#2C5282' : '#ffffff')};
  color: ${({ $active }) => ($active ? '#ffffff' : '#718096')};
  font-size: 13px;
  font-weight: ${({ $active }) => ($active ? '600' : '400')};
  cursor: pointer;
  font-family: inherit;
  transition: all 0.5s ease;

  &:hover {
    border-color: #2C5282;
    color: ${({ $active }) => ($active ? '#ffffff' : '#2C5282')};
  }
`

const DateRange = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`

const DateInput = styled.input`
  padding: 7px 10px;
  border: 1px solid #CBD5E0;
  border-radius: 6px;
  font-size: 13px;
  color: #2D3748;
  outline: none;
  font-family: inherit;

  &:focus {
    border-color: #4299E1;
    box-shadow: 0 0 0 3px rgba(66,153,225,0.15);
  }
`

const DateSep = styled.span`
  font-size: 14px;
  color: #A0AEC0;
`

const List = styled.div`
  background: #ffffff;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
`

const SkeletonCard = styled.div`
  padding: 14px 20px;
  border-bottom: 1px solid #EDF2F7;
  display: flex;
  flex-direction: column;
  gap: 8px;

  &:last-child {
    border-bottom: none;
  }
`

const Empty = styled.p`
  text-align: center;
  color: #A0AEC0;
  font-size: 14px;
  padding: 60px 0;
`

const ErrorMessage = styled.p`
  color: #E53E3E;
  font-size: 14px;
`

const PaginationWrapper = styled.div`
  padding-top: 4px;
`

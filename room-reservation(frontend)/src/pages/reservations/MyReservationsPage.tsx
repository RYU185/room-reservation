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
      <Header>
        <Title>내 예약</Title>
      </Header>

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
          <DateSep>~</DateSep>
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
              <Skeleton height="18px" width="50%" />
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

const Header = styled.div``

const Title = styled.h1`
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
`

const FilterRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`

const TabGroup = styled.div`
  display: flex;
  gap: 4px;
`

const TabButton = styled.button<{ $active: boolean }>`
  padding: 6px 14px;
  border-radius: 99px;
  border: 1.5px solid ${({ $active }) => ($active ? '#2563eb' : '#e2e8f0')};
  background: ${({ $active }) => ($active ? '#eff6ff' : '#fff')};
  color: ${({ $active }) => ($active ? '#2563eb' : '#64748b')};
  font-size: 13px;
  font-weight: ${({ $active }) => ($active ? '600' : '400')};
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: #2563eb;
    color: #2563eb;
  }
`

const DateRange = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`

const DateInput = styled.input`
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  color: #334155;
  outline: none;

  &:focus {
    border-color: #2563eb;
  }
`

const DateSep = styled.span`
  font-size: 13px;
  color: #94a3b8;
`

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const SkeletonCard = styled.div`
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const Empty = styled.p`
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
  padding: 60px 0;
`

const ErrorMessage = styled.p`
  color: #dc2626;
  font-size: 14px;
`

const PaginationWrapper = styled.div`
  padding-top: 4px;
`

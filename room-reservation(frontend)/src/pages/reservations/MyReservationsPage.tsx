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

const Header = styled.div``

const Title = styled.h1`
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #111111;
  letter-spacing: -0.3px;
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

const DateRange = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
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

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const SkeletonCard = styled.div`
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 7px;
  padding: 15px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const Empty = styled.p`
  text-align: center;
  color: #aaaaaa;
  font-size: 16px;
  padding: 60px 0;
`

const ErrorMessage = styled.p`
  color: #dc2626;
  font-size: 16px;
`

const PaginationWrapper = styled.div`
  padding-top: 4px;
`

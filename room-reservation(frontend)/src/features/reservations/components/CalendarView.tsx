import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  isToday,
  format,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import styled from 'styled-components'
import Skeleton from '@/shared/components/Skeleton'
import type { Reservation } from '../types'

interface Props {
  year: number
  month: number
  reservations: Reservation[]
  onDateClick: (date: Date, items: Reservation[]) => void
  loading: boolean
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function CalendarView({ year, month, reservations, onDateClick, loading }: Props) {
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = endOfMonth(firstDay)
  const days = eachDayOfInterval({ start: startOfMonth(firstDay), end: lastDay })
  const startOffset = getDay(firstDay)

  const cells: (Date | null)[] = [
    ...Array<null>(startOffset).fill(null),
    ...days,
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  function getReservationsForDay(date: Date) {
    return reservations.filter((r) => isSameDay(new Date(r.startTime), date))
  }

  if (loading) {
    return (
      <Wrapper>
        <WeekdayRow>
          {WEEKDAYS.map((d) => <Weekday key={d}>{d}</Weekday>)}
        </WeekdayRow>
        <Grid>
          {Array.from({ length: 35 }).map((_, i) => (
            <CellSkeleton key={i}>
              <Skeleton height="14px" width="24px" />
            </CellSkeleton>
          ))}
        </Grid>
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      <WeekdayRow>
        {WEEKDAYS.map((d) => <Weekday key={d}>{d}</Weekday>)}
      </WeekdayRow>
      <Grid>
        {cells.map((date, i) => {
          if (!date) return <EmptyCell key={i} />
          const items = getReservationsForDay(date)
          const today = isToday(date)
          const dayLabel = format(date, 'd', { locale: ko })
          return (
            <Cell key={i} onClick={() => onDateClick(date, items)} $hasItems={items.length > 0}>
              <DayNumber $today={today}>{dayLabel}</DayNumber>
              {items.slice(0, 3).map((r) => (
                <EventBadge key={r.id} $cancelled={r.status === 'CANCELLED'}>
                  {r.title}
                </EventBadge>
              ))}
              {items.length > 3 && <MoreBadge>+{items.length - 3}</MoreBadge>}
            </Cell>
          )
        })}
      </Grid>
    </Wrapper>
  )
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
`

const WeekdayRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid #e5e5e5;
`

const Weekday = styled.div`
  padding: 8px 0;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  color: #aaaaaa;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-left: 1px solid #e5e5e5;
  border-top: 1px solid #e5e5e5;
`

const Cell = styled.div<{ $hasItems: boolean }>`
  min-height: 80px;
  padding: 6px 8px;
  border-right: 1px solid #e5e5e5;
  border-bottom: 1px solid #e5e5e5;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 3px;
  background: #fff;
  transition: background 0.1s;

  &:hover {
    background: #f5f5f5;
  }
`

const EmptyCell = styled.div`
  min-height: 80px;
  border-right: 1px solid #e5e5e5;
  border-bottom: 1px solid #e5e5e5;
  background: #fafafa;
`

const CellSkeleton = styled.div`
  min-height: 80px;
  padding: 8px;
  border-right: 1px solid #e5e5e5;
  border-bottom: 1px solid #e5e5e5;
`

const DayNumber = styled.span<{ $today: boolean }>`
  font-size: 15px;
  font-weight: ${({ $today }) => ($today ? '700' : '400')};
  color: ${({ $today }) => ($today ? '#fff' : '#333333')};
  background: ${({ $today }) => ($today ? '#111111' : 'transparent')};
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`

const EventBadge = styled.span<{ $cancelled: boolean }>`
  font-size: 13px;
  padding: 1px 5px;
  border-radius: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background: ${({ $cancelled }) => ($cancelled ? '#f0f0f0' : '#111111')};
  color: ${({ $cancelled }) => ($cancelled ? '#aaaaaa' : '#ffffff')};
`

const MoreBadge = styled.span`
  font-size: 12px;
  color: #aaaaaa;
  padding-left: 2px;
`

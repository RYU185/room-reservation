import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import styled from 'styled-components'
import { useCalendar } from '@/features/reservations/hooks/useCalendar'
import CalendarView from '@/features/reservations/components/CalendarView'
import ReservationCard from '@/features/reservations/components/ReservationCard'
import type { Reservation } from '@/features/reservations/types'

export default function CalendarPage() {
  const navigate = useNavigate()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedItems, setSelectedItems] = useState<Reservation[]>([])

  const { reservations, loading, error } = useCalendar(year, month)

  function prevMonth() {
    if (month === 1) {
      setYear((y) => y - 1)
      setMonth(12)
    } else {
      setMonth((m) => m - 1)
    }
    setSelectedDate(null)
    setSelectedItems([])
  }

  function nextMonth() {
    if (month === 12) {
      setYear((y) => y + 1)
      setMonth(1)
    } else {
      setMonth((m) => m + 1)
    }
    setSelectedDate(null)
    setSelectedItems([])
  }

  function handleDateClick(date: Date, items: Reservation[]) {
    setSelectedDate(date)
    setSelectedItems(items)
  }

  return (
    <Wrapper>
      <Header>
        <Title>캘린더</Title>
      </Header>

      <CalendarCard>
        <MonthNav>
          <NavButton onClick={prevMonth}>◀</NavButton>
          <MonthLabel>
            {format(new Date(year, month - 1), 'yyyy년 M월', { locale: ko })}
          </MonthLabel>
          <NavButton onClick={nextMonth}>▶</NavButton>
        </MonthNav>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <CalendarView
          year={year}
          month={month}
          reservations={reservations}
          onDateClick={handleDateClick}
          loading={loading}
        />
      </CalendarCard>

      {selectedDate && (
        <DayPanel>
          <DayTitle>
            {format(selectedDate, 'M월 d일 (EEE)', { locale: ko })} 예약
          </DayTitle>
          {selectedItems.length === 0 ? (
            <EmptyDay>해당 날짜에 예약이 없습니다.</EmptyDay>
          ) : (
            <DayList>
              {selectedItems.map((r) => (
                <ReservationCard
                  key={r.id}
                  reservation={r}
                  onClick={() => navigate(`/reservations/${r.id}`)}
                />
              ))}
            </DayList>
          )}
        </DayPanel>
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

const CalendarCard = styled.div`
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
`

const MonthNav = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
`

const NavButton = styled.button`
  background: none;
  border: none;
  font-size: 14px;
  color: #64748b;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;

  &:hover {
    background: #f1f5f9;
    color: #334155;
  }
`

const MonthLabel = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
`

const ErrorMessage = styled.p`
  padding: 12px 20px;
  color: #dc2626;
  font-size: 14px;
  margin: 0;
`

const DayPanel = styled.div`
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const DayTitle = styled.h3`
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #334155;
`

const EmptyDay = styled.p`
  margin: 0;
  font-size: 13px;
  color: #94a3b8;
`

const DayList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

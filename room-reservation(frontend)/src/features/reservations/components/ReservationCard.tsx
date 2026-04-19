import styled from 'styled-components'
import { Calendar, Clock, MapPin } from 'lucide-react'
import { formatDate, formatTime } from '@/shared/utils/date'
import type { Reservation } from '../types'

interface Props {
  reservation: Reservation
  onClick: () => void
}

export default function ReservationCard({ reservation, onClick }: Props) {
  const isConfirmed = reservation.status === 'CONFIRMED'

  return (
    <Card onClick={onClick}>
      <IconArea>
        <Calendar size={20} color="#2C5282" strokeWidth={1.8} />
      </IconArea>
      <CardBody>
        <CardTop>
          <Title>{reservation.title}</Title>
          <StatusBadge $confirmed={isConfirmed}>
            <StatusDot $confirmed={isConfirmed} />
            {isConfirmed ? '예약 확정' : '취소됨'}
          </StatusBadge>
        </CardTop>
        <MetaRow>
          <MetaItem>
            <MapPin size={12} color="#A0AEC0" strokeWidth={1.8} />
            {reservation.room.name} · {reservation.room.location}
          </MetaItem>
          <MetaItem>
            <Clock size={12} color="#A0AEC0" strokeWidth={1.8} />
            <TimeText>
              {formatDate(reservation.startTime)} {formatTime(reservation.startTime)} ~ {formatTime(reservation.endTime)}
            </TimeText>
          </MetaItem>
        </MetaRow>
      </CardBody>
    </Card>
  )
}

const Card = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 20px;
  cursor: pointer;
  border-bottom: 1px solid #EDF2F7;
  transition: background 150ms ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #F7FAFC;
  }
`

const IconArea = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #EBF8FF;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`

const CardBody = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
`

const CardTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
`

const Title = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #2D3748;
`

const StatusBadge = styled.span<{ $confirmed: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 500;
  padding: 3px 9px;
  border-radius: 9999px;
  background: ${({ $confirmed }) => ($confirmed ? '#C6F6D5' : '#EDF2F7')};
  color: ${({ $confirmed }) => ($confirmed ? '#276749' : '#718096')};
`

const StatusDot = styled.span<{ $confirmed: boolean }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ $confirmed }) => ($confirmed ? '#38A169' : '#A0AEC0')};
  flex-shrink: 0;
`

const MetaRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`

const MetaItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #718096;
`

const TimeText = styled.span`
  font-family: 'Fira Code', monospace;
  font-size: 12px;
`

import styled from 'styled-components'
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
      <CardTop>
        <Title>{reservation.title}</Title>
        <StatusBadge $confirmed={isConfirmed}>
          {isConfirmed ? '예약 확정' : '취소됨'}
        </StatusBadge>
      </CardTop>
      <RoomInfo>
        {reservation.room.name} · {reservation.room.location}
      </RoomInfo>
      <TimeInfo>
        {formatDate(reservation.startTime)} {formatTime(reservation.startTime)} ~{' '}
        {formatTime(reservation.endTime)}
      </TimeInfo>
    </Card>
  )
}

const Card = styled.div`
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px 20px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: box-shadow 0.15s, border-color 0.15s;

  &:hover {
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.07);
    border-color: #bfdbfe;
  }
`

const CardTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
`

const Title = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
`

const StatusBadge = styled.span<{ $confirmed: boolean }>`
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 99px;
  background: ${({ $confirmed }) => ($confirmed ? '#dcfce7' : '#f1f5f9')};
  color: ${({ $confirmed }) => ($confirmed ? '#166534' : '#64748b')};
`

const RoomInfo = styled.span`
  font-size: 13px;
  color: #64748b;
`

const TimeInfo = styled.span`
  font-size: 13px;
  color: #94a3b8;
`

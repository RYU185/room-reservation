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
  border: 1px solid #e5e5e5;
  border-radius: 7px;
  padding: 15px 18px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 5px;
  transition: border-color 0.1s;

  &:hover {
    border-color: #aaaaaa;
  }
`

const CardTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
`

const Title = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: #111111;
`

const StatusBadge = styled.span<{ $confirmed: boolean }>`
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 500;
  padding: 2px 7px;
  border-radius: 99px;
  background: ${({ $confirmed }) => ($confirmed ? '#f0fdf4' : '#f5f5f5')};
  color: ${({ $confirmed }) => ($confirmed ? '#15803d' : '#888888')};
`

const RoomInfo = styled.span`
  font-size: 15px;
  color: #777777;
`

const TimeInfo = styled.span`
  font-size: 15px;
  color: #aaaaaa;
`

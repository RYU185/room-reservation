import styled from 'styled-components'
import type { RoomStats } from '@/features/admin/types'

interface Props {
  stats: RoomStats[]
}

export default function StatsBarChart({ stats }: Props) {
  const sorted = [...stats].sort((a, b) => b.utilizationRate - a.utilizationRate)

  return (
    <ChartWrapper>
      {sorted.map((s) => (
        <Row key={s.roomId}>
          <RoomLabel title={s.roomName}>{s.roomName}</RoomLabel>
          <BarArea>
            <Bar $rate={s.utilizationRate} />
            <RateLabel>{s.utilizationRate.toFixed(1)}%</RateLabel>
          </BarArea>
          <CountLabel>{s.confirmedReservations}건</CountLabel>
        </Row>
      ))}
    </ChartWrapper>
  )
}

const ChartWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const RoomLabel = styled.span`
  font-size: 15px;
  font-weight: 500;
  color: #333333;
  width: 140px;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const BarArea = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
`

const Bar = styled.div<{ $rate: number }>`
  height: 16px;
  border-radius: 3px;
  background: ${({ $rate }) => ($rate >= 70 ? '#111111' : $rate >= 40 ? '#555555' : '#cccccc')};
  width: ${({ $rate }) => Math.max($rate, 1)}%;
  transition: width 0.3s ease;
`

const RateLabel = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #555555;
  white-space: nowrap;
`

const CountLabel = styled.span`
  font-size: 14px;
  color: #aaaaaa;
  width: 40px;
  text-align: right;
  flex-shrink: 0;
`

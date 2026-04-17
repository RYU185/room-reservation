import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { getRoomStats } from '@/features/admin/api/admin.api'
import type { RoomStats } from '@/features/admin/types'
import Skeleton from '@/shared/components/Skeleton'
import StatsBarChart from '@/features/admin/components/StatsBarChart'

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 3 }, (_, i) => CURRENT_YEAR - i)
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

export default function AdminStatsPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [stats, setStats] = useState<RoomStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getRoomStats(year, month)
      .then((data) => {
        if (!cancelled) setStats(data)
      })
      .catch(() => {
        if (!cancelled) setError('통계를 불러오는 데 실패했습니다.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [year, month])

  const totalReservations = stats.reduce((sum, s) => sum + s.totalReservations, 0)
  const confirmedReservations = stats.reduce((sum, s) => sum + s.confirmedReservations, 0)
  const avgUtilization =
    stats.length > 0
      ? stats.reduce((sum, s) => sum + s.utilizationRate, 0) / stats.length
      : 0

  return (
    <Wrapper>
      <PageHeader>
        <PageTitle>통계</PageTitle>
        <FilterRow>
          <Select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </Select>
          <Select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((m) => (
              <option key={m} value={m}>{m}월</option>
            ))}
          </Select>
        </FilterRow>
      </PageHeader>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {loading ? (
        <>
          <SummaryRow>
            {Array.from({ length: 3 }).map((_, i) => (
              <SummaryCard key={i}>
                <Skeleton height="13px" width="50%" />
                <Skeleton height="28px" width="40%" />
              </SummaryCard>
            ))}
          </SummaryRow>
          <ChartCard>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i}>
                <Skeleton height="13px" width="130px" />
                <Skeleton height="18px" />
              </SkeletonRow>
            ))}
          </ChartCard>
        </>
      ) : stats.length === 0 ? (
        <Empty>해당 기간의 통계 데이터가 없습니다.</Empty>
      ) : (
        <>
          <SummaryRow>
            <SummaryCard>
              <SummaryLabel>총 예약 수</SummaryLabel>
              <SummaryValue>{totalReservations}건</SummaryValue>
            </SummaryCard>
            <SummaryCard>
              <SummaryLabel>확정 예약</SummaryLabel>
              <SummaryValue>{confirmedReservations}건</SummaryValue>
            </SummaryCard>
            <SummaryCard>
              <SummaryLabel>평균 가동률</SummaryLabel>
              <SummaryValue>{avgUtilization.toFixed(1)}%</SummaryValue>
            </SummaryCard>
          </SummaryRow>

          <ChartCard>
            <ChartTitle>회의실별 가동률</ChartTitle>
            <ChartLegend>
              <LegendItem $shade="dark">70% 이상</LegendItem>
              <LegendItem $shade="mid">40~70%</LegendItem>
              <LegendItem $shade="light">40% 미만</LegendItem>
            </ChartLegend>
            <StatsBarChart stats={stats} />
          </ChartCard>

          <DetailCard>
            <ChartTitle>상세 데이터</ChartTitle>
            <Table>
              <thead>
                <tr>
                  <Th>회의실</Th>
                  <Th>총 예약</Th>
                  <Th>확정 예약</Th>
                  <Th>가동률</Th>
                </tr>
              </thead>
              <tbody>
                {[...stats]
                  .sort((a, b) => b.utilizationRate - a.utilizationRate)
                  .map((s) => (
                    <tr key={s.roomId}>
                      <Td>{s.roomName}</Td>
                      <Td>{s.totalReservations}건</Td>
                      <Td>{s.confirmedReservations}건</Td>
                      <Td>
                        <RateCell $rate={s.utilizationRate}>
                          {s.utilizationRate.toFixed(1)}%
                        </RateCell>
                      </Td>
                    </tr>
                  ))}
              </tbody>
            </Table>
          </DetailCard>
        </>
      )}
    </Wrapper>
  )
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
`

const PageTitle = styled.h1`
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #111111;
  letter-spacing: -0.3px;
`

const FilterRow = styled.div`
  display: flex;
  gap: 8px;
`

const Select = styled.select`
  padding: 5px 9px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 15px;
  color: #333333;
  background: #fff;
  outline: none;
  cursor: pointer;

  &:focus {
    border-color: #111111;
  }
`

const SummaryRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
`

const SummaryCard = styled.div`
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const SummaryLabel = styled.span`
  font-size: 14px;
  color: #888888;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 500;
`

const SummaryValue = styled.span`
  font-size: 28px;
  font-weight: 700;
  color: #111111;
  letter-spacing: -0.5px;
`

const ChartCard = styled.div`
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`

const ChartTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333333;
`

const ChartLegend = styled.div`
  display: flex;
  gap: 16px;
`

const LegendItem = styled.span<{ $shade: 'dark' | 'mid' | 'light' }>`
  font-size: 14px;
  color: #777777;
  display: flex;
  align-items: center;
  gap: 6px;

  &::before {
    content: '';
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 2px;
    background: ${({ $shade }) =>
      $shade === 'dark' ? '#111111' : $shade === 'mid' ? '#555555' : '#cccccc'};
  }
`

const SkeletonRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const DetailCard = styled.div`
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
  padding: 11px 20px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: #888888;
  background: #fafafa;
  border-bottom: 1px solid #e5e5e5;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`

const Td = styled.td`
  padding: 12px 20px;
  font-size: 16px;
  color: #333333;
  border-bottom: 1px solid #f0f0f0;
`

const RateCell = styled.span<{ $rate: number }>`
  font-weight: 600;
  color: ${({ $rate }) => ($rate >= 70 ? '#111111' : $rate >= 40 ? '#555555' : '#aaaaaa')};
`

const Empty = styled.p`
  text-align: center;
  color: #aaaaaa;
  font-size: 16px;
  padding: 60px 0;
  margin: 0;
`

const ErrorMessage = styled.p`
  margin: 0;
  font-size: 16px;
  color: #dc2626;
`

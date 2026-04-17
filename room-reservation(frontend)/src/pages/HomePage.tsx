import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { parseISO, format, isToday, isTomorrow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { getMyReservations } from '@/features/reservations/api/reservations.api'
import type { Reservation } from '@/features/reservations/types'
import { useAuth } from '@/features/auth/context/AuthContext'
import { formatTime } from '@/shared/utils/date'
import Skeleton from '@/shared/components/Skeleton'

export default function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const from = new Date().toISOString().slice(0, 10)
    getMyReservations({ status: 'CONFIRMED', from, size: 10, page: 1 })
      .then((data) => setReservations(data.reservations))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const today = new Date()
  const todayReservations = reservations.filter((r) => isToday(parseISO(r.startTime)))
  const upcomingReservations = reservations.filter((r) => !isToday(parseISO(r.startTime)))

  const todayLabel = format(today, 'yyyy년 M월 d일 EEEE', { locale: ko })

  function getDateLabel(isoStr: string): string {
    const date = parseISO(isoStr)
    if (isTomorrow(date)) return '내일'
    return format(date, 'M월 d일 (EEE)', { locale: ko })
  }

  return (
    <Wrapper>
      <PageHeader>
        <div>
          <Greeting>안녕하세요, {user?.name}님</Greeting>
          <DateText>{todayLabel}</DateText>
        </div>
        <NewButton onClick={() => navigate('/reservations/new')}>+ 새 예약</NewButton>
      </PageHeader>

      <QuickLinks>
        <QuickLink onClick={() => navigate('/rooms')}>
          <QuickLinkTitle>회의실 목록</QuickLinkTitle>
          <QuickLinkDesc>예약 가능한 회의실 확인</QuickLinkDesc>
        </QuickLink>
        <QuickLink onClick={() => navigate('/reservations/my')}>
          <QuickLinkTitle>내 예약</QuickLinkTitle>
          <QuickLinkDesc>전체 예약 이력 관리</QuickLinkDesc>
        </QuickLink>
        <QuickLink onClick={() => navigate('/calendar')}>
          <QuickLinkTitle>캘린더</QuickLinkTitle>
          <QuickLinkDesc>월별 예약 현황 보기</QuickLinkDesc>
        </QuickLink>
      </QuickLinks>

      <SectionRow>
        <Section>
          <SectionHead>
            <SectionTitle>오늘의 예약</SectionTitle>
            <SectionBadge>{loading ? '–' : todayReservations.length}</SectionBadge>
          </SectionHead>
          {loading ? (
            <SkeletonRows count={2} />
          ) : todayReservations.length === 0 ? (
            <Empty>오늘 예정된 예약이 없습니다.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>제목</Th>
                  <Th>회의실</Th>
                  <Th>위치</Th>
                  <Th>시간</Th>
                </tr>
              </thead>
              <tbody>
                {todayReservations.map((r) => (
                  <Tr key={r.id} onClick={() => navigate(`/reservations/${r.id}`)}>
                    <Td>
                      <TitleCell>{r.title}</TitleCell>
                    </Td>
                    <Td>{r.room.name}</Td>
                    <Td>{r.room.location}</Td>
                    <Td>
                      {formatTime(r.startTime)} – {formatTime(r.endTime)}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Section>

        <Section>
          <SectionHead>
            <SectionTitle>다가오는 예약</SectionTitle>
            <SectionBadge>{loading ? '–' : upcomingReservations.length}</SectionBadge>
          </SectionHead>
          {loading ? (
            <SkeletonRows count={3} />
          ) : upcomingReservations.length === 0 ? (
            <Empty>예정된 예약이 없습니다.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>제목</Th>
                  <Th>회의실</Th>
                  <Th>날짜</Th>
                  <Th>시간</Th>
                </tr>
              </thead>
              <tbody>
                {upcomingReservations.map((r) => (
                  <Tr key={r.id} onClick={() => navigate(`/reservations/${r.id}`)}>
                    <Td>
                      <TitleCell>{r.title}</TitleCell>
                    </Td>
                    <Td>{r.room.name}</Td>
                    <Td>{getDateLabel(r.startTime)}</Td>
                    <Td>
                      {formatTime(r.startTime)} – {formatTime(r.endTime)}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Section>
      </SectionRow>
    </Wrapper>
  )
}

function SkeletonRows({ count }: { count: number }) {
  return (
    <SkeletonList>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i}>
          <Skeleton height="13px" width="35%" />
          <Skeleton height="13px" width="20%" />
          <Skeleton height="13px" width="18%" />
        </SkeletonRow>
      ))}
    </SkeletonList>
  )
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const PageHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding-bottom: 4px;
`

const Greeting = styled.h1`
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 700;
  color: #111111;
  letter-spacing: -0.3px;
`

const DateText = styled.p`
  margin: 0;
  font-size: 14px;
  color: #aaaaaa;
`

const NewButton = styled.button`
  padding: 7px 16px;
  background: #111111;
  border: none;
  border-radius: 5px;
  font-size: 15px;
  font-weight: 500;
  color: #ffffff;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;

  &:hover {
    background: #000000;
  }
`

const QuickLinks = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
`

const QuickLink = styled.button`
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  padding: 16px 18px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.1s, background 0.1s;

  &:hover {
    border-color: #cccccc;
    background: #fafafa;
  }
`

const QuickLinkTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #111111;
  margin-bottom: 4px;
`

const QuickLinkDesc = styled.div`
  font-size: 13px;
  color: #aaaaaa;
`

const SectionRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const Section = styled.div`
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  overflow: hidden;
`

const SectionHead = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px 12px;
  border-bottom: 1px solid #f0f0f0;
`

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #333333;
`

const SectionBadge = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #888888;
  background: #f5f5f5;
  padding: 1px 7px;
  border-radius: 99px;
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`

const Th = styled.th`
  padding: 9px 20px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #aaaaaa;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
`

const Tr = styled.tr`
  cursor: pointer;
  transition: background 0.1s;

  &:hover {
    background: #fafafa;
  }

  &:not(:last-child) td {
    border-bottom: 1px solid #f5f5f5;
  }
`

const Td = styled.td`
  padding: 11px 20px;
  font-size: 15px;
  color: #333333;
  vertical-align: middle;
`

const TitleCell = styled.span`
  font-weight: 500;
  color: #111111;
`

const Empty = styled.p`
  margin: 0;
  padding: 28px 20px;
  font-size: 15px;
  color: #aaaaaa;
  text-align: center;
`

const SkeletonList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`

const SkeletonRow = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }
`

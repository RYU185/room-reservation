import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import styled from 'styled-components'
import { parseISO, format, isToday, isTomorrow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Calendar, BookOpen, Clock, Building2, Plus, CheckCircle, X } from 'lucide-react'
import { getMyReservations } from '@/features/reservations/api/reservations.api'
import type { Reservation } from '@/features/reservations/types'
import { useAuth } from '@/features/auth/context/AuthContext'
import { formatTime } from '@/shared/utils/date'
import Skeleton from '@/shared/components/Skeleton'

export default function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [showConfirmation, setShowConfirmation] = useState(
    () => !!(location.state as { showConfirmation?: boolean } | null)?.showConfirmation,
  )

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
      {showConfirmation && (
        <ConfirmationBanner>
          <CheckCircle size={20} color="#38A169" strokeWidth={1.8} />
          <BannerText>
            <BannerTitle>예약이 완료되었습니다</BannerTitle>
            <BannerSub>예약 내역은 '내 예약'에서 확인할 수 있습니다.</BannerSub>
          </BannerText>
          <DismissButton onClick={() => setShowConfirmation(false)}>
            <X size={16} color="#38A169" strokeWidth={1.8} />
          </DismissButton>
        </ConfirmationBanner>
      )}

      <PageHeader>
        <div>
          <Greeting>안녕하세요, {user?.name}님 👋</Greeting>
          <DateText>{todayLabel}</DateText>
        </div>
        <NewButton onClick={() => navigate('/rooms')}>
          <Plus size={14} strokeWidth={2} />
          새 예약
        </NewButton>
      </PageHeader>

      <StatRow>
        <StatCard $accent="#4299E1">
          <StatLabel>오늘 예약</StatLabel>
          <StatValue>{loading ? '–' : todayReservations.length}</StatValue>
          <StatSub>건</StatSub>
        </StatCard>
        <StatCard $accent="#38A169">
          <StatLabel>다가오는 예약</StatLabel>
          <StatValue>{loading ? '–' : upcomingReservations.length}</StatValue>
          <StatSub>건</StatSub>
        </StatCard>
        <StatCard $accent="#D69E2E">
          <StatLabel>이번 달 예약</StatLabel>
          <StatValue>{loading ? '–' : reservations.length}</StatValue>
          <StatSub>건</StatSub>
        </StatCard>
      </StatRow>

      <QuickLinks>
        <QuickLink onClick={() => navigate('/rooms')}>
          <QuickIcon $color="#EBF8FF">
            <Building2 size={20} color="#2C5282" strokeWidth={1.8} />
          </QuickIcon>
          <QuickContent>
            <QuickLinkTitle>회의실 찾기</QuickLinkTitle>
            <QuickLinkDesc>예약 가능한 회의실 확인</QuickLinkDesc>
          </QuickContent>
        </QuickLink>
        <QuickLink onClick={() => navigate('/reservations/my')}>
          <QuickIcon $color="#EBF8FF">
            <BookOpen size={20} color="#2C5282" strokeWidth={1.8} />
          </QuickIcon>
          <QuickContent>
            <QuickLinkTitle>내 예약</QuickLinkTitle>
            <QuickLinkDesc>전체 예약 이력 관리</QuickLinkDesc>
          </QuickContent>
        </QuickLink>
        <QuickLink onClick={() => navigate('/calendar')}>
          <QuickIcon $color="#EBF8FF">
            <Calendar size={20} color="#2C5282" strokeWidth={1.8} />
          </QuickIcon>
          <QuickContent>
            <QuickLinkTitle>캘린더</QuickLinkTitle>
            <QuickLinkDesc>월별 예약 현황 보기</QuickLinkDesc>
          </QuickContent>
        </QuickLink>
      </QuickLinks>

      <SectionRow>
        <Section>
          <SectionHead>
            <SectionHeadLeft>
              <Clock size={16} color="#2C5282" strokeWidth={1.8} />
              <SectionTitle>오늘의 예약</SectionTitle>
            </SectionHeadLeft>
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
                    <Td><TitleCell>{r.title}</TitleCell></Td>
                    <Td>{r.room.name}</Td>
                    <Td>{r.room.location}</Td>
                    <Td>
                      <TimeCell>
                        {formatTime(r.startTime)} – {formatTime(r.endTime)}
                      </TimeCell>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Section>

        <Section>
          <SectionHead>
            <SectionHeadLeft>
              <Calendar size={16} color="#2C5282" strokeWidth={1.8} />
              <SectionTitle>다가오는 예약</SectionTitle>
            </SectionHeadLeft>
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
                    <Td><TitleCell>{r.title}</TitleCell></Td>
                    <Td>{r.room.name}</Td>
                    <Td>{getDateLabel(r.startTime)}</Td>
                    <Td>
                      <TimeCell>
                        {formatTime(r.startTime)} – {formatTime(r.endTime)}
                      </TimeCell>
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
  color: #1B2E5E;
  letter-spacing: -0.3px;
`

const DateText = styled.p`
  margin: 0;
  font-size: 14px;
  color: #A0AEC0;
`

const NewButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #2C5282;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background 200ms ease;

  &:hover {
    background: #23407A;
  }
`

const StatRow = styled.div`
  display: flex;
  gap: 16px;
`

const StatCard = styled.div<{ $accent: string }>`
  background: #ffffff;
  border: 1px solid #E2E8F0;
  border-top: 3px solid ${({ $accent }) => $accent};
  border-radius: 8px;
  padding: 16px 20px;
  flex: 1;
`

const StatLabel = styled.div`
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #A0AEC0;
  margin-bottom: 8px;
`

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: #1B2E5E;
  line-height: 1;
  display: inline;
`

const StatSub = styled.span`
  font-size: 14px;
  color: #A0AEC0;
  margin-left: 4px;
`

const QuickLinks = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
`

const QuickLink = styled.button`
  background: #ffffff;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 16px;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: box-shadow 200ms ease, border-color 200ms ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);

  &:hover {
    box-shadow: 0 4px 6px rgba(0,0,0,0.07);
    border-color: #BEE3F8;
  }
`

const QuickIcon = styled.div<{ $color: string }>`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`

const QuickContent = styled.div``

const QuickLinkTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #2D3748;
  margin-bottom: 3px;
`

const QuickLinkDesc = styled.div`
  font-size: 12px;
  color: #A0AEC0;
`

const SectionRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const Section = styled.div`
  background: #ffffff;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
`

const SectionHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px 12px;
  border-bottom: 1px solid #EDF2F7;
`

const SectionHeadLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #2D3748;
`

const SectionBadge = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #718096;
  background: #EDF2F7;
  padding: 2px 8px;
  border-radius: 9999px;
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`

const Th = styled.th`
  padding: 9px 20px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  color: #A0AEC0;
  background: #F7FAFC;
  border-bottom: 1px solid #EDF2F7;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
`

const Tr = styled.tr`
  cursor: pointer;
  transition: background 150ms ease;

  &:hover {
    background: #F7FAFC;
  }

  &:not(:last-child) td {
    border-bottom: 1px solid #EDF2F7;
  }
`

const Td = styled.td`
  padding: 12px 20px;
  font-size: 14px;
  color: #4A5568;
  vertical-align: middle;
`

const TitleCell = styled.span`
  font-weight: 500;
  color: #2D3748;
`

const TimeCell = styled.span`
  font-family: 'Fira Code', monospace;
  font-size: 13px;
  color: #4A5568;
`

const Empty = styled.p`
  margin: 0;
  padding: 28px 20px;
  font-size: 14px;
  color: #A0AEC0;
  text-align: center;
`

const SkeletonList = styled.div`
  display: flex;
  flex-direction: column;
`

const SkeletonRow = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #EDF2F7;

  &:last-child {
    border-bottom: none;
  }
`

const ConfirmationBanner = styled.div`
  background: #C6F6D5;
  border: 1px solid rgba(56, 161, 105, 0.2);
  border-radius: 8px;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
`

const BannerText = styled.div`
  flex: 1;
`

const BannerTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #276749;
`

const BannerSub = styled.div`
  font-size: 12px;
  color: #38A169;
  margin-top: 1px;
`

const DismissButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
`

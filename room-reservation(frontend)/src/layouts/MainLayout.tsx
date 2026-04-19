import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import styled from 'styled-components'
import { LayoutDashboard, Building2, CalendarDays, BookOpen, Settings, LogOut, Bell } from 'lucide-react'
import { useAuth } from '@/features/auth/context/AuthContext'

const NAV_ITEMS = [
  { to: '/', label: '대시보드', icon: LayoutDashboard, end: true },
  { to: '/rooms', label: '회의실 찾기', icon: Building2, end: false },
  { to: '/reservations/my', label: '내 예약', icon: BookOpen, end: false },
  { to: '/calendar', label: '캘린더', icon: CalendarDays, end: false },
]

const PAGE_TITLES: Record<string, { title: string; subtitle?: string }> = {
  '/': { title: '대시보드', subtitle: '오늘의 예약 현황을 확인하세요' },
  '/rooms': { title: '회의실 찾기', subtitle: '예약 가능한 회의실을 검색하세요' },
  '/reservations/my': { title: '내 예약', subtitle: '예약 이력을 관리하세요' },
  '/reservations/new': { title: '새 예약' },
  '/calendar': { title: '캘린더', subtitle: '월별 예약 현황' },
  '/admin/rooms': { title: '관리자 페이지' },
}

function getPageMeta(pathname: string) {
  if (pathname.startsWith('/reservations/') && pathname !== '/reservations/my' && pathname !== '/reservations/new') {
    return { title: '예약 상세' }
  }
  if (pathname.startsWith('/rooms/')) {
    return { title: '회의실 상세' }
  }
  return PAGE_TITLES[pathname] ?? { title: 'Book & Meet' }
}

export default function MainLayout() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const pageMeta = getPageMeta(location.pathname)
  const initials = user?.name ? user.name[0] : '?'

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <Wrapper>
      <Sidebar>
        <SidebarTop>
          <LogoMark>
            <Building2 size={18} color="#90CDF4" strokeWidth={1.8} />
          </LogoMark>
          <BrandName>Book &amp; Meet</BrandName>
        </SidebarTop>

        <SidebarNav>
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <SideNavLink key={to} to={to} end={end}>
              <Icon size={16} strokeWidth={1.8} />
              <span>{label}</span>
            </SideNavLink>
          ))}

          {isAdmin && (
            <SideNavLink to="/admin/rooms">
              <Settings size={16} strokeWidth={1.8} />
              <span>관리자</span>
            </SideNavLink>
          )}
        </SidebarNav>

        <SidebarBottom>
          <UserRow>
            <UserAvatar>{initials}</UserAvatar>
            <UserMeta>
              <UserName>{user?.name}</UserName>
              <UserEmail>{user?.email}</UserEmail>
            </UserMeta>
          </UserRow>
          <LogoutBtn onClick={handleLogout}>
            <LogOut size={14} strokeWidth={1.8} />
            <span>로그아웃</span>
          </LogoutBtn>
        </SidebarBottom>
      </Sidebar>

      <ContentArea>
        <TopBar>
          <TopBarLeft>
            <PageTitle>{pageMeta.title}</PageTitle>
            {pageMeta.subtitle && <PageSubtitle>{pageMeta.subtitle}</PageSubtitle>}
          </TopBarLeft>
          <NotifBtn>
            <Bell size={16} color="#718096" strokeWidth={1.8} />
            <span>알림</span>
          </NotifBtn>
        </TopBar>
        <ContentInner>
          <Outlet />
        </ContentInner>
      </ContentArea>
    </Wrapper>
  )
}

const Wrapper = styled.div`
  display: flex;
  min-height: 100vh;
`

const Sidebar = styled.aside`
  width: 224px;
  flex-shrink: 0;
  background: #1B2E5E;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: 20;
`

const SidebarTop = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 20px 16px;
  border-bottom: 1px solid #23407A;
`

const LogoMark = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #2C5282;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`

const BrandName = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.3px;
`

const SidebarNav = styled.nav`
  flex: 1;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
`

const SideNavLink = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 6px;
  font-size: 13px;
  color: #63B3ED;
  text-decoration: none;
  transition: background 200ms ease, color 200ms ease;

  &:hover {
    background: #23407A;
    color: #90CDF4;
  }

  &.active {
    background: #2C5282;
    color: #ffffff;
    font-weight: 600;
  }
`

const SidebarBottom = styled.div`
  padding: 12px 10px;
  border-top: 1px solid #23407A;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const UserRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 2px;
`

const UserAvatar = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #2C5282;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #90CDF4;
  flex-shrink: 0;
`

const UserMeta = styled.div`
  flex: 1;
  min-width: 0;
`

const UserName = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const UserEmail = styled.div`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const LogoutBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 7px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  color: #63B3ED;
  cursor: pointer;
  transition: background 200ms ease, color 200ms ease;

  &:hover {
    background: #23407A;
    color: #90CDF4;
  }
`

const ContentArea = styled.main`
  flex: 1;
  margin-left: 224px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #F7FAFC;
`

const TopBar = styled.header`
  height: 56px;
  background: #ffffff;
  border-bottom: 1px solid #E2E8F0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  position: sticky;
  top: 0;
  z-index: 10;
  flex-shrink: 0;
`

const TopBarLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
`

const PageTitle = styled.h1`
  font-size: 16px;
  font-weight: 700;
  color: #2D3748;
  letter-spacing: -0.01em;
`

const PageSubtitle = styled.p`
  font-size: 12px;
  color: #A0AEC0;
  line-height: 1;
`

const NotifBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #ffffff;
  border: 1px solid #E2E8F0;
  border-radius: 6px;
  font-size: 13px;
  color: #718096;
  cursor: pointer;
  transition: background 150ms ease;

  &:hover {
    background: #F7FAFC;
  }
`

const ContentInner = styled.div`
  padding: 28px;
  flex: 1;
  max-width: 1200px;
  width: 100%;
`

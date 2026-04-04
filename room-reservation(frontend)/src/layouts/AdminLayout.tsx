import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { useAuth } from '@/features/auth/context/AuthContext'

const NAV_ITEMS = [
  { to: '/admin/rooms', label: '회의실 관리' },
  { to: '/admin/reservations', label: '예약 관리' },
  { to: '/admin/users', label: '사용자 관리' },
  { to: '/admin/stats', label: '통계' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <Wrapper>
      <Sidebar>
        <SidebarTop>
          <Brand to="/admin/rooms">관리자</Brand>
          <AdminBadge>ADMIN</AdminBadge>
        </SidebarTop>

        <SideNav>
          {NAV_ITEMS.map((item) => (
            <SideNavLink key={item.to} to={item.to} end={item.to === '/admin/rooms'}>
              {item.label}
            </SideNavLink>
          ))}
        </SideNav>

        <SidebarBottom>
          <UserSection>
            <UserName>{user?.name}</UserName>
            <UserEmail>{user?.email}</UserEmail>
          </UserSection>
          <SidebarActions>
            <ActionLink to="/rooms">일반 페이지</ActionLink>
            <LogoutButton onClick={handleLogout}>로그아웃</LogoutButton>
          </SidebarActions>
        </SidebarBottom>
      </Sidebar>

      <Main>
        <Outlet />
      </Main>
    </Wrapper>
  )
}

const Wrapper = styled.div`
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
`

const Sidebar = styled.aside`
  width: 220px;
  flex-shrink: 0;
  background: #1e293b;
  display: flex;
  flex-direction: column;
  padding: 20px 0;
`

const SidebarTop = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 20px 20px;
  border-bottom: 1px solid #334155;
`

const Brand = styled(NavLink)`
  font-size: 16px;
  font-weight: 700;
  color: #f1f5f9;
  text-decoration: none;
`

const AdminBadge = styled.span`
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  background: #2563eb;
  color: #fff;
  letter-spacing: 0.5px;
`

const SideNav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 16px 12px;
  flex: 1;
`

const SideNavLink = styled(NavLink)`
  display: block;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #94a3b8;
  text-decoration: none;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: #334155;
    color: #f1f5f9;
  }

  &.active {
    background: #2563eb;
    color: #fff;
  }
`

const SidebarBottom = styled.div`
  padding: 16px 20px 0;
  border-top: 1px solid #334155;
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const UserSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const UserName = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #f1f5f9;
`

const UserEmail = styled.span`
  font-size: 11px;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const SidebarActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const ActionLink = styled(NavLink)`
  display: block;
  padding: 6px 0;
  font-size: 13px;
  color: #64748b;
  text-decoration: none;
  transition: color 0.15s;

  &:hover {
    color: #94a3b8;
  }
`

const LogoutButton = styled.button`
  background: none;
  border: none;
  padding: 6px 0;
  font-size: 13px;
  color: #64748b;
  cursor: pointer;
  text-align: left;
  transition: color 0.15s;

  &:hover {
    color: #94a3b8;
  }
`

const Main = styled.main`
  flex: 1;
  padding: 28px 32px;
  overflow-y: auto;
  max-width: 1100px;
`

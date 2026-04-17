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
          <Brand to="/admin/rooms">회의실 예약</Brand>
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
  background: #fafafa;
`

const Sidebar = styled.aside`
  width: 216px;
  flex-shrink: 0;
  background: #111111;
  display: flex;
  flex-direction: column;
  padding: 20px 0;
`

const SidebarTop = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px 18px;
  border-bottom: 1px solid #222222;
`

const Brand = styled(NavLink)`
  font-size: 16px;
  font-weight: 600;
  color: #eeeeee;
  text-decoration: none;
  letter-spacing: -0.2px;
`

const AdminBadge = styled.span`
  font-size: 9px;
  font-weight: 700;
  padding: 2px 5px;
  border-radius: 3px;
  background: #333333;
  color: #aaaaaa;
  letter-spacing: 0.5px;
`

const SideNav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 12px 8px;
  flex: 1;
`

const SideNavLink = styled(NavLink)`
  display: block;
  padding: 7px 10px;
  border-radius: 5px;
  font-size: 15px;
  font-weight: 400;
  color: #888888;
  text-decoration: none;
  transition: background 0.1s, color 0.1s;

  &:hover {
    background: #1e1e1e;
    color: #dddddd;
  }

  &.active {
    background: rgba(255, 255, 255, 0.1);
    color: #eeeeee;
    font-weight: 500;
  }
`

const SidebarBottom = styled.div`
  padding: 14px 16px 0;
  border-top: 1px solid #222222;
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const UserSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const UserName = styled.span`
  font-size: 15px;
  font-weight: 500;
  color: #dddddd;
`

const UserEmail = styled.span`
  font-size: 13px;
  color: #666666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const SidebarActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const ActionLink = styled(NavLink)`
  display: block;
  padding: 5px 0;
  font-size: 14px;
  color: #666666;
  text-decoration: none;
  transition: color 0.1s;

  &:hover {
    color: #aaaaaa;
  }
`

const LogoutButton = styled.button`
  background: none;
  border: none;
  padding: 5px 0;
  font-size: 14px;
  color: #666666;
  cursor: pointer;
  text-align: left;
  transition: color 0.1s;

  &:hover {
    color: #aaaaaa;
  }
`

const Main = styled.main`
  flex: 1;
  padding: 28px 32px;
  overflow-y: auto;
  max-width: 1100px;
`

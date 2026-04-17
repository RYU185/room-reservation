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

        <SidebarNav>
          <NavGroup>
            {NAV_ITEMS.map((item) => (
              <SideNavLink key={item.to} to={item.to} end={item.to === '/admin/rooms'}>
                {item.label}
              </SideNavLink>
            ))}
          </NavGroup>
        </SidebarNav>

        <SidebarBottom>
          <UserInfo>
            <UserName>{user?.name}</UserName>
            <UserEmail>{user?.email}</UserEmail>
          </UserInfo>
          <SidebarActions>
            <ActionLink to="/rooms">일반 페이지</ActionLink>
            <LogoutButton onClick={handleLogout}>로그아웃</LogoutButton>
          </SidebarActions>
        </SidebarBottom>
      </Sidebar>

      <ContentArea>
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
  width: 290px;
  flex-shrink: 0;
  background: #111111;
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
`

const SidebarTop = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px 20px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
`

const Brand = styled(NavLink)`
  font-size: 32px;
  font-weight: 700;
  color: #ffffff;
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

const SidebarNav = styled.nav`
  flex: 1;
  overflow-y: auto;
  padding: 6px 0;
`

const NavGroup = styled.div`
  padding: 8px 10px 0 6px;
`

const SideNavLink = styled(NavLink)`
  display: block;
  padding: 7px 29px;
  font-size: 15px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
  transition: color 0.5s, background 0.5s;

  &:hover {
    color: rgba(255, 255, 255, 0.85);
    background: rgba(255, 255, 255, 0.06);
  }

  &.active {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.1);
    font-weight: 500;
  }
`

const SidebarBottom = styled.div`
  padding: 14px 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const UserName = styled.span`
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
`

const UserEmail = styled.span`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.3);
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
  width: 100%;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.45);
  text-decoration: none;
  transition: background 0.1s, color 0.1s;

  &:hover {
    background: rgba(255, 255, 255, 0.11);
    color: rgba(255, 255, 255, 0.75);
  }
`

const LogoutButton = styled.button`
  width: 100%;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.06);
  border: none;
  border-radius: 4px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.45);
  cursor: pointer;
  text-align: left;
  transition: background 0.1s, color 0.1s;

  &:hover {
    background: rgba(255, 255, 255, 0.11);
    color: rgba(255, 255, 255, 0.75);
  }
`

const ContentArea = styled.main`
  flex: 1;
  background: #f5f5f5;
  min-height: 100vh;
  overflow-y: auto;
`

const ContentInner = styled.div`
  padding: 32px 36px;
  max-width: 1100px;
`

import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { useAuth } from '@/features/auth/context/AuthContext'

export default function MainLayout() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <Wrapper>
      <Sidebar>
        <SidebarTop>
          <Brand>회의실 예약</Brand>
        </SidebarTop>

        <SidebarNav>
          <NavGroup>
            <SideNavLink to="/" end>홈</SideNavLink>
            <SideNavLink to="/rooms">회의실</SideNavLink>
            <SideNavLink to="/reservations/my">내 예약</SideNavLink>
            <SideNavLink to="/calendar">캘린더</SideNavLink>
          </NavGroup>

          {isAdmin && (
            <NavGroup>
              <NavGroupLabel>관리자</NavGroupLabel>
              <SideNavLink to="/admin/rooms">관리자 페이지</SideNavLink>
            </NavGroup>
          )}
        </SidebarNav>

        <SidebarBottom>
          <UserInfo>
            <UserName>{user?.name}</UserName>
            <UserEmail>{user?.email}</UserEmail>
          </UserInfo>
          <LogoutButton onClick={handleLogout}>로그아웃</LogoutButton>
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
  padding: 20px 20px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
`

const Brand = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.2px;
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
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
`

const UserEmail = styled.span`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const LogoutButton = styled.button`
  width: 100%;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.06);
  border: none;
  border-radius: 4px;
  font-size: 12px;
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

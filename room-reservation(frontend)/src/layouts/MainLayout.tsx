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
      <Nav>
        <Brand to="/">회의실 예약</Brand>
        <NavLinks>
          <StyledNavLink to="/rooms">회의실</StyledNavLink>
          <StyledNavLink to="/reservations/my">내 예약</StyledNavLink>
          <StyledNavLink to="/calendar">캘린더</StyledNavLink>
          {isAdmin && <StyledNavLink to="/admin/rooms">관리자</StyledNavLink>}
        </NavLinks>
        <UserArea>
          <UserName>{user?.name}</UserName>
          <LogoutButton onClick={handleLogout}>로그아웃</LogoutButton>
        </UserArea>
      </Nav>
      <Content>
        <Outlet />
      </Content>
    </Wrapper>
  )
}

const Wrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
`

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 32px;
  height: 56px;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
`

const Brand = styled(NavLink)`
  font-size: 16px;
  font-weight: 700;
  color: #2563eb;
  text-decoration: none;
  margin-right: 8px;
`

const NavLinks = styled.div`
  display: flex;
  gap: 4px;
  flex: 1;
`

const StyledNavLink = styled(NavLink)`
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  text-decoration: none;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: #f1f5f9;
    color: #334155;
  }

  &.active {
    background: #eff6ff;
    color: #2563eb;
  }
`

const UserArea = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const UserName = styled.span`
  font-size: 14px;
  color: #334155;
`

const LogoutButton = styled.button`
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  font-size: 13px;
  color: #64748b;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: #f1f5f9;
  }
`

const Content = styled.main`
  flex: 1;
  padding: 24px;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
`

import { Outlet } from 'react-router-dom'
import styled from 'styled-components'

export default function AuthLayout() {
  return (
    <Wrapper>
      <Outlet />
    </Wrapper>
  )
}

const Wrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
`

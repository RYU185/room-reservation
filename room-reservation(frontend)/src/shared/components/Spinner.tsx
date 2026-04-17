import styled, { keyframes } from 'styled-components'

interface SpinnerProps {
  size?: number
}

export default function Spinner({ size = 24 }: SpinnerProps) {
  return <StyledSpinner size={size} />
}

const spin = keyframes`
  to { transform: rotate(360deg); }
`

const StyledSpinner = styled.div<{ size: number }>`
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  border: 2px solid #e5e5e5;
  border-top-color: #111111;
  border-radius: 50%;
  animation: ${spin} 0.6s linear infinite;
`

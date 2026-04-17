import styled, { keyframes } from 'styled-components'

interface SkeletonProps {
  width?: string
  height?: string
  borderRadius?: string
}

export default function Skeleton({
  width = '100%',
  height = '16px',
  borderRadius = '4px',
}: SkeletonProps) {
  return <StyledSkeleton width={width} height={height} borderRadius={borderRadius} />
}

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`

const StyledSkeleton = styled.div<{ width: string; height: string; borderRadius: string }>`
  width: ${({ width }) => width};
  height: ${({ height }) => height};
  border-radius: ${({ borderRadius }) => borderRadius};
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite;
`

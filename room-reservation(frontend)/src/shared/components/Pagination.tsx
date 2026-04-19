import styled from 'styled-components'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <Wrapper>
      <PageButton onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
        이전
      </PageButton>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <PageButton key={p} onClick={() => onPageChange(p)} $active={p === page}>
          {p}
        </PageButton>
      ))}

      <PageButton onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
        다음
      </PageButton>
    </Wrapper>
  )
}

const Wrapper = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
`

const PageButton = styled.button<{ $active?: boolean }>`
  padding: 6px 12px;
  border: 1px solid ${({ $active }) => ($active ? '#2C5282' : '#E2E8F0')};
  border-radius: 6px;
  background: ${({ $active }) => ($active ? '#2C5282' : '#ffffff')};
  color: ${({ $active }) => ($active ? '#ffffff' : '#4A5568')};
  cursor: pointer;
  font-size: 14px;
  font-family: inherit;
  font-weight: ${({ $active }) => ($active ? '600' : '400')};
  transition: all 150ms ease;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: ${({ $active }) => ($active ? '#23407A' : '#EBF8FF')};
    border-color: ${({ $active }) => ($active ? '#23407A' : '#BEE3F8')};
  }
`

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
  border: 1px solid ${({ $active }) => ($active ? '#2563eb' : '#e2e8f0')};
  border-radius: 4px;
  background: ${({ $active }) => ($active ? '#2563eb' : '#fff')};
  color: ${({ $active }) => ($active ? '#fff' : '#334155')};
  cursor: pointer;
  font-size: 14px;
  &:disabled { opacity: 0.4; cursor: not-allowed; }
  &:hover:not(:disabled):not([data-active]) { background: #f8fafc; }
`

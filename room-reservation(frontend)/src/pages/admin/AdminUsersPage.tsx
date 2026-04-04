import { useState, useEffect, useCallback } from 'react'
import styled from 'styled-components'
import { getAdminUsers } from '@/features/admin/api/admin.api'
import type { AdminUser } from '@/features/admin/types'
import type { PageMeta } from '@/shared/types'
import Skeleton from '@/shared/components/Skeleton'
import Pagination from '@/shared/components/Pagination'
import UserReservationsModal from '@/features/admin/components/UserReservationsModal'

const PAGE_SIZE = 15

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [meta, setMeta] = useState<PageMeta | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getAdminUsers({ page, size: PAGE_SIZE })
      setUsers(result.users)
      setMeta(result.meta)
    } catch {
      setError('사용자 목록을 불러오는 데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return (
    <Wrapper>
      <PageHeader>
        <PageTitle>사용자 관리</PageTitle>
      </PageHeader>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <TableCard>
        <Table>
          <thead>
            <tr>
              <Th>이름</Th>
              <Th>이메일</Th>
              <Th>역할</Th>
              <Th>가입일</Th>
              <Th>예약 이력</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Td key={j}>
                      <Skeleton height="14px" width="80%" />
                    </Td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <EmptyTd colSpan={5}>등록된 사용자가 없습니다.</EmptyTd>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <Td>
                    <UserName>{user.name}</UserName>
                  </Td>
                  <Td>{user.email}</Td>
                  <Td>
                    <RoleBadge $admin={user.role === 'ROLE_ADMIN'}>
                      {user.role === 'ROLE_ADMIN' ? 'Admin' : 'User'}
                    </RoleBadge>
                  </Td>
                  <Td>{user.createdAt.slice(0, 10)}</Td>
                  <Td>
                    <HistoryButton onClick={() => setSelectedUser(user)}>
                      예약 이력
                    </HistoryButton>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </TableCard>

      {meta && meta.totalPages > 1 && (
        <PaginationWrapper>
          <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />
        </PaginationWrapper>
      )}

      {selectedUser && (
        <UserReservationsModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </Wrapper>
  )
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const PageHeader = styled.div``

const PageTitle = styled.h1`
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
`

const TableCard = styled.div`
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`

const Th = styled.th`
  padding: 12px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
`

const Td = styled.td`
  padding: 12px 16px;
  font-size: 14px;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
`

const EmptyTd = styled.td`
  padding: 48px 16px;
  text-align: center;
  font-size: 14px;
  color: #94a3b8;
`

const UserName = styled.span`
  font-weight: 500;
  color: #1e293b;
`

const RoleBadge = styled.span<{ $admin: boolean }>`
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 99px;
  background: ${({ $admin }) => ($admin ? '#eff6ff' : '#f8fafc')};
  color: ${({ $admin }) => ($admin ? '#2563eb' : '#64748b')};
`

const HistoryButton = styled.button`
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #475569;
  transition: background 0.15s;

  &:hover {
    background: #f1f5f9;
  }
`

const ErrorMessage = styled.p`
  margin: 0;
  font-size: 14px;
  color: #dc2626;
`

const PaginationWrapper = styled.div`
  padding-top: 4px;
`

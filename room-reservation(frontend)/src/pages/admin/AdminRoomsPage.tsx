import { useState, useEffect, useCallback } from 'react'
import styled from 'styled-components'
import { getRooms, deactivateRoom } from '@/features/rooms/api/rooms.api'
import type { Room } from '@/features/rooms/types'
import type { PageMeta } from '@/shared/types'
import Skeleton from '@/shared/components/Skeleton'
import Pagination from '@/shared/components/Pagination'
import RoomFormModal from '@/features/admin/components/RoomFormModal'

const PAGE_SIZE = 15

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [meta, setMeta] = useState<PageMeta | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [editTarget, setEditTarget] = useState<Room | undefined>(undefined)

  const [deactivateTarget, setDeactivateTarget] = useState<Room | null>(null)
  const [deactivating, setDeactivating] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const fetchRooms = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getRooms({ page, size: PAGE_SIZE })
      setRooms(result.rooms)
      setMeta(result.meta)
    } catch {
      setError('회의실 목록을 불러오는 데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  function handleCreateSuccess(room: Room) {
    setModalMode(null)
    setRooms((prev) => [room, ...prev])
  }

  function handleEditSuccess(updated: Room) {
    setModalMode(null)
    setEditTarget(undefined)
    setRooms((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
  }

  async function handleDeactivate() {
    if (!deactivateTarget) return
    setDeactivating(true)
    setActionError(null)
    try {
      await deactivateRoom(deactivateTarget.id)
      setRooms((prev) =>
        prev.map((r) => (r.id === deactivateTarget.id ? { ...r, isActive: false } : r)),
      )
      setDeactivateTarget(null)
    } catch {
      setActionError('비활성화에 실패했습니다.')
    } finally {
      setDeactivating(false)
    }
  }

  return (
    <Wrapper>
      <PageHeader>
        <PageTitle>회의실 관리</PageTitle>
        <AddButton onClick={() => setModalMode('create')}>+ 회의실 추가</AddButton>
      </PageHeader>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <TableCard>
        <Table>
          <thead>
            <tr>
              <Th>이름</Th>
              <Th>위치</Th>
              <Th>수용 인원</Th>
              <Th>시설</Th>
              <Th>상태</Th>
              <Th>액션</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <Td key={j}>
                      <Skeleton height="14px" width="80%" />
                    </Td>
                  ))}
                </tr>
              ))
            ) : rooms.length === 0 ? (
              <tr>
                <EmptyTd colSpan={6}>등록된 회의실이 없습니다.</EmptyTd>
              </tr>
            ) : (
              rooms.map((room) => (
                <tr key={room.id}>
                  <Td>
                    <RoomName>{room.name}</RoomName>
                  </Td>
                  <Td>{room.location}</Td>
                  <Td>{room.capacity}명</Td>
                  <Td>
                    {room.amenities.length > 0 ? (
                      <AmenityList>
                        {room.amenities.slice(0, 2).map((a) => (
                          <AmenityTag key={a}>{a}</AmenityTag>
                        ))}
                        {room.amenities.length > 2 && (
                          <AmenityTag>+{room.amenities.length - 2}</AmenityTag>
                        )}
                      </AmenityList>
                    ) : (
                      <NoneText>-</NoneText>
                    )}
                  </Td>
                  <Td>
                    <StatusBadge $active={room.isActive}>
                      {room.isActive ? '활성' : '비활성'}
                    </StatusBadge>
                  </Td>
                  <Td>
                    <Actions>
                      <ActionBtn
                        onClick={() => {
                          setEditTarget(room)
                          setModalMode('edit')
                        }}
                      >
                        수정
                      </ActionBtn>
                      {room.isActive && (
                        <ActionBtn
                          $danger
                          onClick={() => {
                            setDeactivateTarget(room)
                            setActionError(null)
                          }}
                        >
                          비활성화
                        </ActionBtn>
                      )}
                    </Actions>
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

      {deactivateTarget && (
        <ConfirmOverlay onClick={() => setDeactivateTarget(null)}>
          <ConfirmBox onClick={(e) => e.stopPropagation()}>
            <ConfirmText>
              <strong>{deactivateTarget.name}</strong>을(를) 비활성화하시겠습니까?
              <br />
              <SubText>기존 예약에는 영향이 없습니다.</SubText>
            </ConfirmText>
            {actionError && <ConfirmError>{actionError}</ConfirmError>}
            <ConfirmActions>
              <DangerButton onClick={handleDeactivate} disabled={deactivating}>
                {deactivating ? '처리 중...' : '비활성화'}
              </DangerButton>
              <CancelConfirmButton onClick={() => setDeactivateTarget(null)}>
                취소
              </CancelConfirmButton>
            </ConfirmActions>
          </ConfirmBox>
        </ConfirmOverlay>
      )}

      {modalMode === 'create' && (
        <RoomFormModal
          mode="create"
          onSuccess={handleCreateSuccess}
          onClose={() => setModalMode(null)}
        />
      )}

      {modalMode === 'edit' && editTarget && (
        <RoomFormModal
          mode="edit"
          room={editTarget}
          onSuccess={handleEditSuccess}
          onClose={() => {
            setModalMode(null)
            setEditTarget(undefined)
          }}
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

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const PageTitle = styled.h1`
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
`

const AddButton = styled.button`
  padding: 8px 18px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #1d4ed8;
  }
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

const RoomName = styled.span`
  font-weight: 500;
  color: #1e293b;
`

const AmenityList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`

const AmenityTag = styled.span`
  font-size: 11px;
  padding: 2px 6px;
  background: #eff6ff;
  color: #3b82f6;
  border-radius: 4px;
`

const NoneText = styled.span`
  color: #cbd5e1;
`

const StatusBadge = styled.span<{ $active: boolean }>`
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 99px;
  background: ${({ $active }) => ($active ? '#dcfce7' : '#f1f5f9')};
  color: ${({ $active }) => ($active ? '#166534' : '#94a3b8')};
`

const Actions = styled.div`
  display: flex;
  gap: 6px;
`

const ActionBtn = styled.button<{ $danger?: boolean }>`
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid ${({ $danger }) => ($danger ? '#fecaca' : '#e2e8f0')};
  background: ${({ $danger }) => ($danger ? '#fef2f2' : '#fff')};
  color: ${({ $danger }) => ($danger ? '#dc2626' : '#475569')};
  transition: background 0.15s;

  &:hover {
    background: ${({ $danger }) => ($danger ? '#fee2e2' : '#f1f5f9')};
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

const ConfirmOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`

const ConfirmBox = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  width: 360px;
  max-width: 90vw;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
`

const ConfirmText = styled.p`
  margin: 0;
  font-size: 14px;
  color: #334155;
  line-height: 1.6;
`

const SubText = styled.span`
  font-size: 13px;
  color: #94a3b8;
`

const ConfirmError = styled.p`
  margin: 0;
  font-size: 13px;
  color: #dc2626;
`

const ConfirmActions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`

const DangerButton = styled.button`
  padding: 7px 16px;
  background: #dc2626;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #b91c1c;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const CancelConfirmButton = styled.button`
  padding: 7px 16px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  color: #64748b;
  cursor: pointer;

  &:hover {
    background: #f1f5f9;
  }
`

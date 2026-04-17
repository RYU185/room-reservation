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
        <AddButton onClick={() => setModalMode('create')}>회의실 추가</AddButton>
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
                      <NoneText>—</NoneText>
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
  color: #111111;
  letter-spacing: -0.3px;
`

const AddButton = styled.button`
  padding: 7px 16px;
  background: #111111;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #000000;
  }
`

const TableCard = styled.div`
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  overflow: hidden;
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`

const Th = styled.th`
  padding: 11px 16px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: #888888;
  background: #fafafa;
  border-bottom: 1px solid #e5e5e5;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`

const Td = styled.td`
  padding: 12px 16px;
  font-size: 16px;
  color: #333333;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: middle;
`

const EmptyTd = styled.td`
  padding: 48px 16px;
  text-align: center;
  font-size: 16px;
  color: #aaaaaa;
`

const RoomName = styled.span`
  font-weight: 500;
  color: #111111;
`

const AmenityList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`

const AmenityTag = styled.span`
  font-size: 13px;
  padding: 2px 6px;
  background: #f5f5f5;
  color: #555555;
  border-radius: 4px;
`

const NoneText = styled.span`
  color: #cccccc;
`

const StatusBadge = styled.span<{ $active: boolean }>`
  font-size: 13px;
  font-weight: 500;
  padding: 2px 7px;
  border-radius: 99px;
  background: ${({ $active }) => ($active ? '#f0fdf4' : '#f5f5f5')};
  color: ${({ $active }) => ($active ? '#15803d' : '#aaaaaa')};
`

const Actions = styled.div`
  display: flex;
  gap: 6px;
`

const ActionBtn = styled.button<{ $danger?: boolean }>`
  padding: 4px 10px;
  font-size: 14px;
  border-radius: 5px;
  cursor: pointer;
  border: 1px solid ${({ $danger }) => ($danger ? '#fecaca' : '#e5e5e5')};
  background: ${({ $danger }) => ($danger ? '#fef2f2' : '#fff')};
  color: ${({ $danger }) => ($danger ? '#dc2626' : '#555555')};
  transition: background 0.1s;

  &:hover {
    background: ${({ $danger }) => ($danger ? '#fee2e2' : '#f5f5f5')};
  }
`

const ErrorMessage = styled.p`
  margin: 0;
  font-size: 16px;
  color: #dc2626;
`

const PaginationWrapper = styled.div`
  padding-top: 4px;
`

const ConfirmOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`

const ConfirmBox = styled.div`
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  width: 360px;
  max-width: 90vw;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
`

const ConfirmText = styled.p`
  margin: 0;
  font-size: 16px;
  color: #333333;
  line-height: 1.6;
`

const SubText = styled.span`
  font-size: 15px;
  color: #aaaaaa;
`

const ConfirmError = styled.p`
  margin: 0;
  font-size: 15px;
  color: #dc2626;
`

const ConfirmActions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`

const DangerButton = styled.button`
  padding: 7px 14px;
  background: #dc2626;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 15px;
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
  padding: 7px 14px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 15px;
  color: #777777;
  cursor: pointer;

  &:hover {
    background: #f5f5f5;
  }
`

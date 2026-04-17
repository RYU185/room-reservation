import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { getRooms } from '@/features/rooms/api/rooms.api'
import type { Room } from '@/features/rooms/types'
import type { PageMeta } from '@/shared/types'
import Skeleton from '@/shared/components/Skeleton'
import Pagination from '@/shared/components/Pagination'

export default function RoomListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [location, setLocation] = useState(searchParams.get('location') ?? '')
  const [minCapacity, setMinCapacity] = useState(searchParams.get('minCapacity') ?? '')
  const [page, setPage] = useState(Number(searchParams.get('page') ?? 1))

  const [rooms, setRooms] = useState<Room[]>([])
  const [meta, setMeta] = useState<PageMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchRooms() {
      setLoading(true)
      setError(null)
      try {
        const result = await getRooms({
          location: location || undefined,
          minCapacity: minCapacity ? Number(minCapacity) : undefined,
          page,
          size: 12,
        })
        if (!cancelled) {
          setRooms(result.rooms)
          setMeta(result.meta)
        }
      } catch {
        if (!cancelled) setError('회의실 목록을 불러오는 데 실패했습니다.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchRooms()
    return () => { cancelled = true }
  }, [location, minCapacity, page])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    setSearchParams({
      ...(location && { location }),
      ...(minCapacity && { minCapacity }),
      page: '1',
    })
  }

  function handlePageChange(newPage: number) {
    setPage(newPage)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('page', String(newPage))
      return next
    })
  }

  return (
    <Wrapper>
      <Header>
        <Title>회의실</Title>
      </Header>

      <FilterForm onSubmit={handleSearch}>
        <FilterInput
          type="text"
          placeholder="위치 검색"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <FilterInput
          type="number"
          placeholder="최소 수용 인원"
          min={1}
          value={minCapacity}
          onChange={(e) => setMinCapacity(e.target.value)}
        />
        <SearchButton type="submit">검색</SearchButton>
      </FilterForm>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {loading ? (
        <Grid>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i}>
              <Skeleton height="18px" width="60%" />
              <Skeleton height="13px" width="40%" />
              <Skeleton height="13px" width="30%" />
              <Skeleton height="13px" width="80%" />
            </SkeletonCard>
          ))}
        </Grid>
      ) : rooms.length === 0 ? (
        <Empty>조건에 맞는 회의실이 없습니다.</Empty>
      ) : (
        <Grid>
          {rooms.map((room) => (
            <RoomCard key={room.id} onClick={() => navigate(`/rooms/${room.id}`)}>
              <CardTop>
                <RoomName>{room.name}</RoomName>
                <StatusBadge $active={room.isActive}>
                  {room.isActive ? '사용 가능' : '비활성'}
                </StatusBadge>
              </CardTop>
              <CardMeta>
                <MetaItem>{room.location}</MetaItem>
                <MetaDot />
                <MetaItem>최대 {room.capacity}명</MetaItem>
              </CardMeta>
              {room.description && <Description>{room.description}</Description>}
              {room.amenities.length > 0 && (
                <Amenities>
                  {room.amenities.slice(0, 3).map((a) => (
                    <AmenityTag key={a}>{a}</AmenityTag>
                  ))}
                  {room.amenities.length > 3 && (
                    <AmenityTag>+{room.amenities.length - 3}</AmenityTag>
                  )}
                </Amenities>
              )}
            </RoomCard>
          ))}
        </Grid>
      )}

      {meta && (
        <PaginationWrapper>
          <Pagination page={page} totalPages={meta.totalPages} onPageChange={handlePageChange} />
        </PaginationWrapper>
      )}
    </Wrapper>
  )
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const Header = styled.div`
  display: flex;
  align-items: center;
`

const Title = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: #111111;
  margin: 0;
  letter-spacing: -0.3px;
`

const FilterForm = styled.form`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`

const FilterInput = styled.input`
  padding: 7px 11px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 16px;
  color: #333333;
  background: #fff;
  outline: none;

  &:focus {
    border-color: #111111;
  }

  &[type='number'] {
    width: 140px;
  }
`

const SearchButton = styled.button`
  padding: 7px 18px;
  background: #111111;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #000000;
  }
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
`

const SkeletonCard = styled.div`
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const RoomCard = styled.div`
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 18px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: border-color 0.1s;

  &:hover {
    border-color: #aaaaaa;
  }
`

const CardTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
`

const RoomName = styled.h3`
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: #111111;
`

const StatusBadge = styled.span<{ $active: boolean }>`
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 500;
  padding: 2px 7px;
  border-radius: 99px;
  background: ${({ $active }) => ($active ? '#f0fdf4' : '#f5f5f5')};
  color: ${({ $active }) => ($active ? '#15803d' : '#888888')};
`

const CardMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const MetaItem = styled.span`
  font-size: 15px;
  color: #777777;
`

const MetaDot = styled.span`
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #cccccc;
  flex-shrink: 0;
`

const Description = styled.p`
  margin: 0;
  font-size: 15px;
  color: #aaaaaa;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`

const Amenities = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 2px;
`

const AmenityTag = styled.span`
  font-size: 13px;
  padding: 2px 7px;
  background: #f5f5f5;
  color: #555555;
  border-radius: 4px;
`

const ErrorMessage = styled.p`
  color: #dc2626;
  font-size: 16px;
`

const Empty = styled.p`
  color: #aaaaaa;
  font-size: 16px;
  text-align: center;
  padding: 60px 0;
`

const PaginationWrapper = styled.div`
  padding-top: 8px;
`

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { Search, Users, MapPin } from 'lucide-react'
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
      <FilterForm onSubmit={handleSearch}>
        <SearchWrapper>
          <SearchIcon>
            <Search size={16} color="#A0AEC0" strokeWidth={1.8} />
          </SearchIcon>
          <SearchInput
            type="text"
            placeholder="위치 검색"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </SearchWrapper>
        <CapacityWrapper>
          <Users size={16} color="#A0AEC0" strokeWidth={1.8} />
          <CapacityInput
            type="number"
            placeholder="최소 수용 인원"
            min={1}
            value={minCapacity}
            onChange={(e) => setMinCapacity(e.target.value)}
          />
        </CapacityWrapper>
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
                <FloorLabel>{room.location}</FloorLabel>
                <StatusBadge $active={room.isActive}>
                  <StatusDot $active={room.isActive} />
                  {room.isActive ? '사용 가능' : '비활성'}
                </StatusBadge>
              </CardTop>
              <RoomName>{room.name}</RoomName>
              <CardMeta>
                <MetaItem>
                  <MapPin size={12} color="#A0AEC0" strokeWidth={1.8} />
                  {room.location}
                </MetaItem>
                <MetaDot />
                <MetaItem>
                  <Users size={12} color="#A0AEC0" strokeWidth={1.8} />
                  최대 {room.capacity}명
                </MetaItem>
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

const FilterForm = styled.form`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
`

const SearchWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`

const SearchIcon = styled.div`
  position: absolute;
  left: 10px;
  pointer-events: none;
  display: flex;
  align-items: center;
`

const CapacityWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  border: 1px solid #CBD5E0;
  border-radius: 6px;
  background: #fff;

  &:focus-within {
    border-color: #4299E1;
    box-shadow: 0 0 0 3px rgba(66,153,225,0.15);
  }
`

const baseInputStyles = `
  font-size: 14px;
  color: #2D3748;
  background: #fff;
  outline: none;
  font-family: inherit;
  &::placeholder { color: #A0AEC0; }
`

const SearchInput = styled.input`
  ${baseInputStyles}
  padding: 8px 12px 8px 34px;
  border: 1px solid #CBD5E0;
  border-radius: 6px;
  &:focus {
    border-color: #4299E1;
    box-shadow: 0 0 0 3px rgba(66,153,225,0.15);
  }
`

const CapacityInput = styled.input`
  ${baseInputStyles}
  border: none;
  padding: 8px 0;
  width: 120px;
`

const SearchButton = styled.button`
  padding: 8px 18px;
  background: #2C5282;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: background 200ms ease;

  &:hover {
    background: #23407A;
  }
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
`

const SkeletonCard = styled.div`
  background: #fff;
  border: 1.5px solid #E2E8F0;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const RoomCard = styled.div`
  background: #fff;
  border: 1.5px solid #E2E8F0;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  transition: box-shadow 200ms ease, border-color 200ms ease;

  &:hover {
    box-shadow: 0 4px 6px rgba(0,0,0,0.07);
    border-color: #BEE3F8;
  }
`

const CardTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
`

const FloorLabel = styled.span`
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #A0AEC0;
`

const RoomName = styled.h3`
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #2D3748;
`

const StatusBadge = styled.span<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 500;
  padding: 3px 9px;
  border-radius: 9999px;
  background: ${({ $active }) => ($active ? '#C6F6D5' : '#EDF2F7')};
  color: ${({ $active }) => ($active ? '#276749' : '#718096')};
`

const StatusDot = styled.span<{ $active: boolean }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ $active }) => ($active ? '#38A169' : '#A0AEC0')};
  flex-shrink: 0;
`

const CardMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`

const MetaItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 13px;
  color: #718096;
`

const MetaDot = styled.span`
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #CBD5E0;
  flex-shrink: 0;
`

const Description = styled.p`
  margin: 0;
  font-size: 13px;
  color: #A0AEC0;
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
  font-size: 11px;
  padding: 2px 8px;
  background: #EBF8FF;
  color: #2B6CB0;
  border: 1px solid #BEE3F8;
  border-radius: 9999px;
`

const ErrorMessage = styled.p`
  color: #E53E3E;
  font-size: 14px;
`

const Empty = styled.p`
  color: #A0AEC0;
  font-size: 14px;
  text-align: center;
  padding: 60px 0;
`

const PaginationWrapper = styled.div`
  padding-top: 8px;
`

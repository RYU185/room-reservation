import client from '@/shared/api/client'
import type { ApiResponse, PageMeta } from '@/shared/types'
import type {
  Room,
  RoomAvailabilityResponse,
  RoomCreateRequest,
  RoomFilters,
  RoomUpdateRequest,
} from '../types'

export async function getRooms(filters?: RoomFilters): Promise<{ rooms: Room[]; meta: PageMeta }> {
  const { data } = await client.get<ApiResponse<Room[]>>('/rooms', {
    params: {
      ...filters,
      page: filters?.page !== undefined ? filters.page - 1 : undefined,
    },
  })
  return { rooms: data.data, meta: data.meta! }
}

export async function getRoom(id: number): Promise<Room> {
  const { data } = await client.get<ApiResponse<Room>>(`/rooms/${id}`)
  return data.data
}

export async function checkAvailability(
  id: number,
  startTime: string,
  endTime: string,
): Promise<RoomAvailabilityResponse> {
  const { data } = await client.get<ApiResponse<RoomAvailabilityResponse>>(
    `/rooms/${id}/availability`,
    { params: { startTime, endTime } },
  )
  return data.data
}

export async function createRoom(payload: RoomCreateRequest): Promise<Room> {
  const { data } = await client.post<ApiResponse<Room>>('/rooms', payload)
  return data.data
}

export async function updateRoom(id: number, payload: RoomUpdateRequest): Promise<Room> {
  const { data } = await client.put<ApiResponse<Room>>(`/rooms/${id}`, payload)
  return data.data
}

export async function deactivateRoom(id: number): Promise<void> {
  await client.patch(`/rooms/${id}/deactivate`)
}

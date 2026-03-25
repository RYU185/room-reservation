import client from '@/shared/api/client'
import type { ApiResponse, PageMeta } from '@/shared/types'
import type {
  CalendarFilters,
  Reservation,
  ReservationCreateRequest,
  ReservationFilters,
  ReservationUpdateRequest,
} from '../types'

export async function getMyReservations(
  filters?: ReservationFilters,
): Promise<{ reservations: Reservation[]; meta: PageMeta }> {
  const { data } = await client.get<ApiResponse<Reservation[]>>('/reservations/my', {
    params: {
      ...filters,
      page: filters?.page !== undefined ? filters.page - 1 : undefined,
    },
  })
  return { reservations: data.data, meta: data.meta! }
}

export async function getReservation(id: number): Promise<Reservation> {
  const { data } = await client.get<ApiResponse<Reservation>>(`/reservations/${id}`)
  return data.data
}

export async function getCalendar(filters: CalendarFilters): Promise<Reservation[]> {
  const { data } = await client.get<ApiResponse<Reservation[]>>('/reservations/calendar', {
    params: filters,
  })
  return data.data
}

export async function createReservation(payload: ReservationCreateRequest): Promise<Reservation> {
  const { data } = await client.post<ApiResponse<Reservation>>('/reservations', payload)
  return data.data
}

export async function updateReservation(
  id: number,
  payload: ReservationUpdateRequest,
): Promise<Reservation> {
  const { data } = await client.put<ApiResponse<Reservation>>(`/reservations/${id}`, payload)
  return data.data
}

export async function cancelReservation(id: number): Promise<void> {
  await client.patch(`/reservations/${id}/cancel`)
}

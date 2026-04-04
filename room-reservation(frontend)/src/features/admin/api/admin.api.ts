import client from '@/shared/api/client'
import type { ApiResponse } from '@/shared/types'
import type {
  AdminReservation,
  AdminReservationFilters,
  AdminReservationListResponse,
  AdminUser,
  AdminUserFilters,
  AdminUserListResponse,
  RoomStats,
  UserReservationFilters,
} from '../types'
import type { Reservation } from '@/features/reservations/types'

export async function getAdminReservations(
  filters?: AdminReservationFilters,
): Promise<AdminReservationListResponse> {
  const { data } = await client.get<ApiResponse<AdminReservation[]>>('/admin/reservations', {
    params: {
      ...filters,
      page: filters?.page !== undefined ? filters.page - 1 : undefined,
    },
  })
  return { reservations: data.data, meta: data.meta! }
}

export async function cancelAdminReservation(id: number): Promise<void> {
  await client.patch(`/admin/reservations/${id}/cancel`)
}

export async function getAdminUsers(filters?: AdminUserFilters): Promise<AdminUserListResponse> {
  const { data } = await client.get<ApiResponse<AdminUser[]>>('/admin/users', {
    params: {
      ...filters,
      page: filters?.page !== undefined ? filters.page - 1 : undefined,
    },
  })
  return { users: data.data, meta: data.meta! }
}

export async function getUserReservations(
  userId: number,
  filters?: UserReservationFilters,
): Promise<{ reservations: Reservation[]; meta: import('@/shared/types').PageMeta }> {
  const { data } = await client.get<ApiResponse<Reservation[]>>(
    `/admin/users/${userId}/reservations`,
    {
      params: {
        ...filters,
        page: filters?.page !== undefined ? filters.page - 1 : undefined,
      },
    },
  )
  return { reservations: data.data, meta: data.meta! }
}

export async function getRoomStats(year: number, month: number): Promise<RoomStats[]> {
  const { data } = await client.get<ApiResponse<RoomStats[]>>('/admin/stats/rooms', {
    params: { year, month },
  })
  return data.data
}

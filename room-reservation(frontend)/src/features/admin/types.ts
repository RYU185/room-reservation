import type { RoomSummary } from '@/features/rooms/types'
import type { ReservationStatus, UserSummary } from '@/features/reservations/types'
import type { PageMeta } from '@/shared/types'

export type { UserSummary }

export interface AdminReservation {
  id: number
  room: RoomSummary
  user: UserSummary
  title: string
  description: string
  startTime: string
  endTime: string
  status: ReservationStatus
  createdAt: string
}

export interface AdminUser {
  id: number
  email: string
  name: string
  role: 'ROLE_USER' | 'ROLE_ADMIN'
  createdAt: string
}

export interface RoomStats {
  roomId: number
  roomName: string
  totalReservations: number
  confirmedReservations: number
  utilizationRate: number
}

export interface AdminReservationFilters {
  roomId?: number
  userId?: number
  status?: ReservationStatus
  from?: string
  to?: string
  page?: number
  size?: number
}

export interface AdminUserFilters {
  page?: number
  size?: number
}

export interface UserReservationFilters {
  page?: number
  size?: number
}

export interface AdminReservationListResponse {
  reservations: AdminReservation[]
  meta: PageMeta
}

export interface AdminUserListResponse {
  users: AdminUser[]
  meta: PageMeta
}

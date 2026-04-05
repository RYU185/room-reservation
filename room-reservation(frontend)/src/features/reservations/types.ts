import type { RoomSummary } from '@/features/rooms/types'

export type ReservationStatus = 'CONFIRMED' | 'CANCELLED'

export interface UserSummary {
  id: number
  name: string
  email: string
}

export interface Reservation {
  id: number
  room: RoomSummary
  user?: UserSummary
  title: string
  description: string
  startTime: string
  endTime: string
  status: ReservationStatus
  createdAt: string
}

export interface ReservationFilters {
  status?: ReservationStatus
  from?: string
  to?: string
  page?: number
  size?: number
}

export interface ReservationCreateRequest {
  roomId: number
  title: string
  description?: string
  startTime: string
  endTime: string
}

export type ReservationUpdateRequest = Omit<ReservationCreateRequest, 'roomId'>

export interface CalendarFilters {
  year: number
  month: number
  roomId?: number
}

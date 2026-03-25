export interface Room {
  id: number
  name: string
  location: string
  capacity: number
  description: string
  amenities: string[]
  isActive: boolean
  createdAt: string
}

export interface RoomSummary {
  id: number
  name: string
  location: string
}

export interface ConflictingReservation {
  id: number
  title: string
  startTime: string
  endTime: string
}

export interface RoomAvailabilityResponse {
  roomId: number
  available: boolean
  conflictingReservations: ConflictingReservation[]
}

export interface RoomFilters {
  location?: string
  minCapacity?: number
  page?: number
  size?: number
}

export interface RoomCreateRequest {
  name: string
  location: string
  capacity: number
  description?: string
  amenities?: string[]
}

export type RoomUpdateRequest = RoomCreateRequest

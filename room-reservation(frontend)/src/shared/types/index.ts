// 도메인 타입(Room, Reservation, User 등)은 각 features/[domain]/ 에 정의한다.
// 여기에는 API 응답 공통 래퍼와 에러 구조만 둔다.

export interface PageMeta {
  total: number
  page: number
  size: number
  totalPages: number
}

export interface ApiResponse<T> {
  success: true
  data: T
  meta?: PageMeta
}

export interface FieldError {
  field: string
  message: string
}

export interface ErrorResponse {
  success: false
  code: string
  message: string
  timestamp: string
  errors?: FieldError[]
}

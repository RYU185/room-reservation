export interface User {
  id: number
  email: string
  name: string
  role: 'ROLE_USER' | 'ROLE_ADMIN'
  createdAt: string
}

export interface LoginTokenResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
}

import client from '@/shared/api/client'
import type { ApiResponse } from '@/shared/types'
import type { LoginTokenResponse, User } from '../types'

export async function register(email: string, password: string, name: string): Promise<LoginTokenResponse> {
  const { data } = await client.post<ApiResponse<LoginTokenResponse>>('/auth/register', {
    email,
    password,
    name,
  })
  return data.data
}

export async function login(email: string, password: string): Promise<LoginTokenResponse> {
  const { data } = await client.post<ApiResponse<LoginTokenResponse>>('/auth/login', {
    email,
    password,
  })
  return data.data
}

export async function logout(): Promise<void> {
  await client.post('/auth/logout')
}

export async function refresh(): Promise<LoginTokenResponse> {
  const { data } = await client.post<ApiResponse<LoginTokenResponse>>('/auth/refresh')
  return data.data
}

export async function getMe(): Promise<User> {
  const { data } = await client.get<ApiResponse<User>>('/auth/me')
  return data.data
}

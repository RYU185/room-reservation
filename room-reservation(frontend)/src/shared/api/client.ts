import axios, { InternalAxiosRequestConfig } from 'axios'
import { tokenStore } from './tokenStore'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1'

// 재시도 여부를 config에 붙이기 위한 타입 확장
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

const client = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Refresh Token 쿠키 자동 전송
})

// ── 요청 인터셉터 ────────────────────────────────────────────
// 모든 요청 헤더에 Access Token 주입
client.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── 응답 인터셉터 ────────────────────────────────────────────
// 401 감지 → Access Token 갱신 후 원래 요청 재시도 (waitQueue 패턴)

let isRefreshing = false
let waitQueue: Array<(newToken: string) => void> = []

function resolveQueue(newToken: string) {
  waitQueue.forEach((resolve) => resolve(newToken))
  waitQueue = []
}

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetryableRequestConfig

    // 401이 아니거나 이미 재시도한 요청이면 그냥 에러 반환
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    // 갱신이 진행 중이면 대기열에 추가 후 갱신 완료 시 재시도
    if (isRefreshing) {
      return new Promise((resolve) => {
        waitQueue.push((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          resolve(client(originalRequest))
        })
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const { data } = await axios.post(
        `${BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      )
      const newToken: string = data.data.accessToken

      tokenStore.set(newToken)
      resolveQueue(newToken)

      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return client(originalRequest)
    } catch {
      tokenStore.set(null)
      waitQueue = []
      window.location.href = '/login'
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  },
)

export default client

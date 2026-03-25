import { createContext, useContext, useEffect, useState } from 'react'
import { tokenStore } from '@/shared/api/tokenStore'
import { login as loginApi, logout as logoutApi, register as registerApi, refresh, getMe } from '../api/auth.api'
import type { User } from '../types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  isLoading: boolean
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>
  loginWithOAuth: (token: string) => Promise<void>
  logout: () => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
}

const AuthContext = createContext<(AuthState & AuthActions) | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true) // 앱 시작 시 세션 복구 중

  // 앱 시작 시 Refresh Token 쿠키로 세션 복구 시도
  useEffect(() => {
    refresh()
      .then(({ accessToken }) => {
        tokenStore.set(accessToken)
        return getMe()
      })
      .then(setUser)
      .catch(() => {
        tokenStore.set(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  async function login(email: string, password: string) {
    const { accessToken } = await loginApi(email, password)
    tokenStore.set(accessToken)
    const me = await getMe()
    setUser(me)
  }

  async function signUp(email: string, password: string, name: string) {
    const { accessToken } = await registerApi(email, password, name)
    tokenStore.set(accessToken)
    const me = await getMe()
    setUser(me)
  }

  async function loginWithOAuth(token: string) {
    tokenStore.set(token)
    const me = await getMe()
    setUser(me)
  }

  async function logout() {
    await logoutApi()
    tokenStore.set(null)
    setUser(null)
  }

  const isAuthenticated = user !== null
  const isAdmin = user?.role === 'ROLE_ADMIN'

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isAdmin, isLoading, login, loginWithOAuth, logout, signUp }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth는 AuthProvider 내부에서만 사용할 수 있습니다')
  }
  return context
}

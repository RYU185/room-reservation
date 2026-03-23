import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'

export default function OAuthCallbackPage() {
  const navigate = useNavigate()
  const { loginWithOAuth } = useAuth()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const error = params.get('error')

    if (error || !token) {
      navigate('/login?error=oauth', { replace: true })
      return
    }

    // URL에서 토큰 즉시 제거 (브라우저 히스토리, Referer 헤더 노출 방지)
    window.history.replaceState({}, '', window.location.pathname)

    loginWithOAuth(token)
      .then(() => navigate('/', { replace: true }))
      .catch(() => navigate('/login?error=oauth', { replace: true }))
  }, [])

  return <div>로그인 처리 중...</div>
}

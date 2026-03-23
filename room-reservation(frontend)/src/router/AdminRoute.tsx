import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'

export default function AdminRoute() {
  const { isAdmin, isLoading } = useAuth()

  if (isLoading) return null
  return isAdmin ? <Outlet /> : <Navigate to="/" replace />
}

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'

export default function PrivateRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return null
  return isAuthenticated
    ? <Outlet />
    : <Navigate to="/login" state={{ from: location.pathname }} replace />
}

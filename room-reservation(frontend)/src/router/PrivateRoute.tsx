import { Navigate, Outlet } from 'react-router-dom'

export default function PrivateRoute() {
  // TODO: AuthContext에서 isAuthenticated 읽기
  const isAuthenticated = false

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

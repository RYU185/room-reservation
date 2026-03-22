import { Navigate, Outlet } from 'react-router-dom'

export default function AdminRoute() {
  // TODO: AuthContext에서 isAdmin 읽기
  const isAdmin = false

  return isAdmin ? <Outlet /> : <Navigate to="/" replace />
}

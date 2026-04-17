import { createBrowserRouter } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'
import AdminLayout from '@/layouts/AdminLayout'
import AuthLayout from '@/layouts/AuthLayout'
import PrivateRoute from './PrivateRoute'
import AdminRoute from './AdminRoute'
import LoginPage from '@/pages/auth/LoginPage'
import SignUpPage from '@/pages/auth/SignUpPage'
import OAuthCallbackPage from '@/pages/auth/OAuthCallbackPage'
import RoomListPage from '@/pages/rooms/RoomListPage'
import RoomDetailPage from '@/pages/rooms/RoomDetailPage'
import ReservationNewPage from '@/pages/reservations/ReservationNewPage'
import MyReservationsPage from '@/pages/reservations/MyReservationsPage'
import ReservationDetailPage from '@/pages/reservations/ReservationDetailPage'
import CalendarPage from '@/pages/reservations/CalendarPage'
import AdminRoomsPage from '@/pages/admin/AdminRoomsPage'
import AdminReservationsPage from '@/pages/admin/AdminReservationsPage'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'
import AdminStatsPage from '@/pages/admin/AdminStatsPage'
import NotFoundPage from '@/pages/NotFoundPage'
import HomePage from '@/pages/HomePage'

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignUpPage /> },
      { path: '/oauth2/callback', element: <OAuthCallbackPage /> },
    ],
  },
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/rooms', element: <RoomListPage /> },
          { path: '/rooms/:id', element: <RoomDetailPage /> },
          { path: '/reservations/new', element: <ReservationNewPage /> },
          { path: '/reservations/my', element: <MyReservationsPage /> },
          { path: '/reservations/:id', element: <ReservationDetailPage /> },
          { path: '/calendar', element: <CalendarPage /> },
        ],
      },
      {
        element: <AdminRoute />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { path: '/admin/rooms', element: <AdminRoomsPage /> },
              { path: '/admin/reservations', element: <AdminReservationsPage /> },
              { path: '/admin/users', element: <AdminUsersPage /> },
              { path: '/admin/stats', element: <AdminStatsPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])

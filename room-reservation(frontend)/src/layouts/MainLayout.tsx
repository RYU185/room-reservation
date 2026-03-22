import { Outlet } from 'react-router-dom'

export default function MainLayout() {
  return (
    <div>
      <header>헤더</header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}

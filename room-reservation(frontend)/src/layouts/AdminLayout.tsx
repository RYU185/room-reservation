import { Outlet } from 'react-router-dom'

export default function AdminLayout() {
  return (
    <div>
      <header>관리자 헤더</header>
      <aside>사이드바</aside>
      <main>
        <Outlet />
      </main>
    </div>
  )
}

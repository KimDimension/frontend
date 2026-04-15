import { createBrowserRouter, Navigate } from 'react-router-dom'
import LoginPage from '../pages/auth/LoginPage'

// 추후 구현될 페이지들 (임시 placeholder)
const PlaceholderPage = ({ title }) => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h2>{title}</h2>
    <p>준비 중입니다.</p>
  </div>
)

// 로그인 필요 라우트 보호
function PrivateRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('access_token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  // ── 의사 ────────────────────────────────────────────────────
  {
    path: '/doctor',
    element: <PrivateRoute><PlaceholderPage title="의사 대시보드" /></PrivateRoute>,
  },
  // ── 환자 ────────────────────────────────────────────────────
  {
    path: '/patient',
    element: <PrivateRoute><PlaceholderPage title="환자 기록 제출" /></PrivateRoute>,
  },
])

export default router

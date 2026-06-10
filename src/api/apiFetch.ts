import useAuthStore from '../store/authStore'

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// 동시 요청이 401을 동시에 받아도 refresh는 한 번만 수행하도록 공유
let refreshPromise: Promise<string | null> | null = null

async function doRefresh(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refresh_token')
  if (!refreshToken) return null
  try {
    const res = await fetch(`${BASE}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!res.ok) return null
    const data = await res.json()
    localStorage.setItem('access_token', data.access_token)
    if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token)
    return data.access_token as string
  } catch {
    return null
  }
}

function forceLogout() {
  useAuthStore.getState().logout()
  window.location.href = '/login'
}

function withAuth(init: RequestInit | undefined, token: string | null): RequestInit {
  const headers = new Headers(init?.headers || {})
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return { ...init, headers }
}

/**
 * 인증 토큰을 자동 첨부하고 401 시 refresh 후 1회 재시도하는 fetch 래퍼.
 *
 * raw fetch가 access token 만료(60분) 시점에 refresh 없이 즉시 /login으로
 * 튕기던 문제(인증 처리 이원화)를 해결한다. 시그니처는 native fetch와 동일하므로
 * 호출부에서 `fetch(` → `apiFetch(` 로 교체하기만 하면 된다.
 */
export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const token = localStorage.getItem('access_token')
  let res = await fetch(input, withAuth(init, token))
  if (res.status !== 401) return res

  // 401 → refresh 시도 (동시 요청은 하나의 refresh 공유)
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => { refreshPromise = null })
  }
  const newToken = await refreshPromise

  if (!newToken) {
    forceLogout()
    return res
  }

  // 새 토큰으로 1회 재시도 — 여기서도 401이면 refresh가 무효이므로 로그아웃
  res = await fetch(input, withAuth(init, newToken))
  if (res.status === 401) forceLogout()
  return res
}

export default apiFetch

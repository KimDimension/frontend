import { create } from 'zustand'
import axios from 'axios'
import { login as apiLogin } from '../api/auth'
import type { User, UserRole } from '../types'

interface AuthState {
  user: User | null
  isLoading: boolean
  isHydrated: boolean
  error: string | null
  login: (phone_number: string, password: string, autoLogin: boolean) => Promise<UserRole>
  logout: () => void
  restoreUser: (user: User) => void
  hydrateAuth: () => Promise<void>
}

// 자동로그인 여부에 따라 저장 위치 결정
function getAutoStorage(): Storage {
  return localStorage.getItem('auto_login') === 'true' ? localStorage : sessionStorage
}

// 두 스토리지 중 하나에서 값 읽기
export function getStoredToken(key: string): string | null {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key)
}

function clearAllTokens() {
  const keys = ['access_token', 'refresh_token', 'user_name', 'user_role']
  keys.forEach(k => {
    localStorage.removeItem(k)
    sessionStorage.removeItem(k)
  })
  localStorage.removeItem('auto_login')
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isHydrated: false,
  error: null,

  // 앱 시작 시 refresh_token으로 세션 복원
  hydrateAuth: async () => {
    const refreshToken = getStoredToken('refresh_token')
    if (!refreshToken) {
      set({ isHydrated: true })
      return
    }
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/auth/refresh`,
        { refresh_token: refreshToken },
      )
      const storage = getAutoStorage()
      storage.setItem('access_token', data.access_token)
      if (data.refresh_token) storage.setItem('refresh_token', data.refresh_token)

      const name = getStoredToken('user_name') ?? ''
      const role = getStoredToken('user_role') as UserRole | null
      set({
        user: role ? { id: 0, name, role, doctor_id: null } : null,

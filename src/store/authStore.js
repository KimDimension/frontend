import { create } from 'zustand'
import { login as apiLogin } from '../api/auth'

const useAuthStore = create((set) => ({
  user: null,       // { user_id, name, role }
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const data = await apiLogin(email, password)
      localStorage.setItem('access_token', data.access_token)
      set({
        user: { id: data.user_id, name: data.name, role: data.role },
        isLoading: false,
      })
      return data.role  // 역할에 따라 리다이렉트용
    } catch (err) {
      const msg = err.response?.data?.detail || '로그인에 실패했습니다.'
      set({ error: msg, isLoading: false })
      throw err
    }
  },

  logout: () => {
    localStorage.removeItem('access_token')
    set({ user: null, error: null })
  },

  // 페이지 새로고침 후 토큰으로 유저 복원
  restoreUser: (user) => set({ user }),
}))

export default useAuthStore

import { create } from 'zustand'
import { authService } from '../services/auth-service'
import type { User, AuthState } from '../../@types/user'

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  login: async (email, senha, mfaCode) => {
    await authService.login(email, senha, mfaCode)
    const user = await authService.getMe()
    set({ user, isAuthenticated: true, loading: false })
  },

  logout: async () => {
    await authService.logout()
    set({ user: null, isAuthenticated: false, loading: false })
  },

  fetchMe: async () => {
    try {
      set({ loading: true })
      const user = await authService.getMe()
      set({ user, isAuthenticated: true, loading: false })
    } catch {
      set({ user: null, isAuthenticated: false, loading: false })
    }
  },
}))

import { api } from '@/lib/api-client';
import type { User } from '../../@types/user';

export const authService = {
  login: async (email: string, senha: string): Promise<void> => {
    await api.post('/api/auth/login', { email, senha });
  },

  logout: async (): Promise<void> => {
    await api.post('/api/auth/logout', {});
  },

  getMe: async (): Promise<User> => {
    return await api.get<User>('/api/usuarios/me');
  },

  changePassword: async (email: string, senhaAtual: string, novaSenha: string): Promise<void> => {
    await api.post('/api/auth/change-password', { email, senhaAtual, novaSenha });
  }
};

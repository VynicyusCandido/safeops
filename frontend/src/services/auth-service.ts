import { api } from '@/lib/api-client';
import type { User } from '../../@types/user';

export const authService = {
  login: async (email: string, senha: string, mfaCode?: string): Promise<void> => {
    await api.post('/api/auth/login', { email, senha, mfaCode });
  },

  logout: async (): Promise<void> => {
    await api.post('/api/auth/logout', {});
  },

  getMe: async (): Promise<User> => {
    return await api.get<User>('/api/usuarios/me');
  },

  changePassword: async (senhaAtual: string, novaSenha: string, email?: string): Promise<void> => {
    await api.post('/api/auth/change-password', { email, senhaAtual, novaSenha });
  }
};


import { api } from '@/lib/api-client';
import type { User } from '../../@types/user';

export const userService = {
  getUsuarios: async (): Promise<User[]> => {
    return await api.get<User[]>('/api/admin/usuarios');
  },

  createUsuario: async (nome: string, email: string, senha: string, perfil: string): Promise<User> => {
    return await api.post<User>('/api/admin/usuarios', {
      nome,
      email,
      senha,
      perfil,
    });
  },

  toggleUsuarioStatus: async (userId: string, ativo: boolean): Promise<void> => {
    await api.patch(`/api/admin/usuarios/${userId}`, { ativo });
  }
};

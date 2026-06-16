// frontend/@types/user.d.ts
export type UserRole = 'SOLICITANTE' | 'ANALISTA' | 'ADMINISTRADOR';

export interface User {
  id: string;
  nome: string;
  email: string;
  perfil: UserRole;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

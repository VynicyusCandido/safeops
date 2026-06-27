// frontend/@types/user.d.ts
export type UserRole = 'SOLICITANTE' | 'ANALISTA' | 'ADMINISTRADOR';

export interface User {
  id: string;
  nome: string;
  email: string;
  perfil: UserRole;
  ativo: boolean;
  criadoEm: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, senha: string, mfaCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

// frontend/@types/occurrence.d.ts
import type { User } from './user';

export type OccurrenceStatus = 'ABERTA' | 'EM_ANALISE' | 'RESOLVIDA' | 'ENCERRADA';
export type OccurrencePriority = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export interface Ocorrencia {
  id: string;
  titulo: string;
  descricao: string;
  status: OccurrenceStatus;
  prioridade: OccurrencePriority;
  criadoEm: string;
  solicitante?: User;
  analista?: User;
}

export interface Comentario {
  id: string;
  conteudo: string;
  criadoEm: string;
  autorId: string;
  autorNome: string;
}

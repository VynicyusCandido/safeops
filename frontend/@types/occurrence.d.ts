// frontend/@types/occurrence.d.ts
export type OccurrenceStatus = 'ABERTO' | 'EM_ANALISE' | 'RESOLVIDO' | 'CANCELADO';

export interface Occurrence {
  id: string;
  titulo: string;
  descricao: string;
  status: OccurrenceStatus;
  dataCriacao: string;
  solicitanteId: string;
  analistaId?: string;
}

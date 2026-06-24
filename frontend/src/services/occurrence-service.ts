import { api } from '@/lib/api-client';
import type { Ocorrencia, Comentario, OccurrenceStatus } from '../../@types/occurrence';

export const occurrenceService = {
  getOcorrencias: async (): Promise<Ocorrencia[]> => {
    return await api.get<Ocorrencia[]>('/api/ocorrencias');
  },

  createOcorrencia: async (titulo: string, descricao: string | null, prioridade: string): Promise<Ocorrencia> => {
    return await api.post<Ocorrencia>('/api/ocorrencias', {
      titulo,
      descricao,
      prioridade,
    });
  },

  updateStatus: async (ocorrenciaId: string, status: OccurrenceStatus): Promise<Ocorrencia> => {
    return await api.patch<Ocorrencia>(`/api/ocorrencias/${ocorrenciaId}/status`, { status });
  },

  atribuirAnalista: async (ocorrenciaId: string, analistaId: string): Promise<Ocorrencia> => {
    return await api.patch<Ocorrencia>(`/api/ocorrencias/${ocorrenciaId}/analista`, { analistaId });
  },

  getComentarios: async (ocorrenciaId: string): Promise<Comentario[]> => {
    return await api.get<Comentario[]>(`/api/ocorrencias/${ocorrenciaId}/comentarios`);
  },

  addComentario: async (ocorrenciaId: string, conteudo: string): Promise<void> => {
    await api.post(`/api/ocorrencias/${ocorrenciaId}/comentarios`, { conteudo });
  }
};


import { api } from '@/lib/api-client';
import type { Ocorrencia, Comentario } from '../../@types/occurrence';

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

  getComentarios: async (ocorrenciaId: string): Promise<Comentario[]> => {
    return await api.get<Comentario[]>(`/api/ocorrencias/${ocorrenciaId}/comentarios`);
  },

  addComentario: async (ocorrenciaId: string, conteudo: string): Promise<void> => {
    await api.post(`/api/ocorrencias/${ocorrenciaId}/comentarios`, { conteudo });
  }
};

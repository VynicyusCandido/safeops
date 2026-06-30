import { api } from '@/lib/api-client';
import type { LogAuditoria } from '../../@types/audit';

export const auditService = {
  getLogs: async (filtroAcao: string, dataInicio: string, dataFim: string): Promise<LogAuditoria[]> => {
    const params = new URLSearchParams();
    if (filtroAcao && filtroAcao !== "ALL") params.append("acao", filtroAcao);
    if (dataInicio) params.append("de", dataInicio);
    if (dataFim) params.append("ate", dataFim);
    
    const url = `/api/admin/logs${params.toString() ? '?' + params.toString() : ''}`;
    return await api.get<LogAuditoria[]>(url);
  }
};

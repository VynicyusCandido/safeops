// frontend/@types/audit.d.ts
export interface LogAuditoria {
  id: string;
  acao: string;
  usuarioId: string | null;
  entidade: string | null;
  entidadeId: string | null;
  detalhe: string | null;
  ip: string | null;
  criadoEm: string;
}

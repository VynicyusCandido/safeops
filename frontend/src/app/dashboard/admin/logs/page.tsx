"use client";

import { useEffect, useState, useCallback } from "react";
import { auditService } from "@/services/audit-service";
import type { LogAuditoria } from "../../../../../@types/audit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  ScrollText,
  Loader2,
  AlertCircle,
  Search,
  Filter,
  ChevronDown,
  Globe,
} from "lucide-react";



const acaoOptions = [
  { value: "", label: "Todas as ações" },
  { value: "LOGIN", label: "Login" },
  { value: "LOGIN_FALHO", label: "Login Falho" },
  { value: "CRIAR_OCORRENCIA", label: "Criar Ocorrência" },
  { value: "ALTERAR_STATUS", label: "Alterar Status" },
  { value: "ADICIONAR_COMENTARIO", label: "Adicionar Comentário" },
  { value: "ATRIBUIR_ANALISTA", label: "Atribuir Analista" },
  { value: "CRIAR_USUARIO", label: "Criar Usuário" },
  { value: "EDITAR_USUARIO", label: "Editar Usuário" },
  { value: "ACESSO_NEGADO", label: "Acesso Negado" },
  { value: "VISUALIZAR_LOGS", label: "Visualizar Logs" },
];

const acaoColorMap: Record<string, string> = {
  LOGIN: "bg-emerald-100 text-emerald-700",
  LOGIN_FALHO: "bg-red-100 text-red-700",
  CRIAR_OCORRENCIA: "bg-blue-100 text-blue-700",
  ALTERAR_STATUS: "bg-amber-100 text-amber-700",
  ADICIONAR_COMENTARIO: "bg-violet-100 text-violet-700",
  ATRIBUIR_ANALISTA: "bg-cyan-100 text-cyan-700",
  CRIAR_USUARIO: "bg-teal-100 text-teal-700",
  EDITAR_USUARIO: "bg-orange-100 text-orange-700",
  ACESSO_NEGADO: "bg-red-100 text-red-800",
  VISUALIZAR_LOGS: "bg-slate-100 text-slate-600",
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [acao, setAcao] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await auditService.getLogs(acao, de, ate);
      setLogs(data);
      setError("");
    } catch {
      setError("Erro ao carregar logs de auditoria.");
    } finally {
      setLoading(false);
    }
  }, [acao, de, ate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  function handleClearFilters() {
    setAcao("");
    setDe("");
    setAte("");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ScrollText className="h-7 w-7 text-purple-600" />
            Logs de Auditoria
          </h1>
          <p className="text-slate-500 mt-1">
            Acompanhe todas as ações realizadas no sistema.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="h-10 px-4 text-sm"
          >
            <Filter className="h-4 w-4 mr-1.5" />
            Filtros
            {(acao || de || ate) && (
              <span className="ml-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {[acao, de, ate].filter(Boolean).length}
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={fetchLogs}
            className="h-10 px-4 text-sm"
          >
            <Search className="h-4 w-4 mr-1.5" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="p-5 shadow-sm border-slate-200/60 animate-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Ação
              </label>
              <div className="relative">
                <select
                  value={acao}
                  onChange={(e) => setAcao(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 appearance-none cursor-pointer"
                >
                  {acaoOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                De
              </label>
              <Input
                type="date"
                value={de}
                onChange={(e) => setDe(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Até
              </label>
              <Input
                type="date"
                value={ate}
                onChange={(e) => setAte(e.target.value)}
                className="h-10"
              />
            </div>
          </div>
          {(acao || de || ate) && (
            <div className="mt-3 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-xs text-slate-500"
              >
                Limpar filtros
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      )}

      {/* Empty */}
      {!loading && logs.length === 0 && (
        <div className="text-center py-16">
          <ScrollText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600">
            Nenhum log encontrado
          </h3>
          <p className="text-slate-400 mt-1">
            Ajuste os filtros ou aguarde novas atividades.
          </p>
        </div>
      )}

      {/* Table */}
      {!loading && logs.length > 0 && (
        <Card className="shadow-sm border-slate-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">
                    Data/Hora
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">
                    Ação
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">
                    Usuário ID
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">
                    Entidade
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">
                    Detalhe
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">
                    IP
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const acaoLabel =
                    acaoOptions.find((o) => o.value === log.acao)?.label ??
                    log.acao;
                  const acaoColor =
                    acaoColorMap[log.acao] ?? "bg-slate-100 text-slate-600";

                  return (
                    <tr
                      key={log.id}
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-slate-600 text-xs whitespace-nowrap">
                        {formatDateTime(log.criadoEm)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${acaoColor}`}
                        >
                          {acaoLabel}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs font-mono">
                        {log.usuarioId
                          ? log.usuarioId.substring(0, 8) + "…"
                          : "—"}
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {log.entidade ?? "—"}
                        {log.entidadeId && (
                          <span className="text-slate-400 ml-1 font-mono">
                            ({log.entidadeId.substring(0, 8)}…)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs max-w-[300px] truncate">
                        {log.detalhe ?? "—"}
                      </td>
                      <td className="py-3 px-4">
                        {log.ip ? (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <Globe className="h-3 w-3" />
                            {log.ip}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/30 text-xs text-slate-500">
            {logs.length} registro{logs.length !== 1 ? "s" : ""} encontrado
            {logs.length !== 1 ? "s" : ""}
          </div>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { occurrenceService } from "@/services/occurrence-service";
import type { Ocorrencia, Comentario } from "../../../../@types/occurrence";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Plus,
  X,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  MessageSquare,
  ChevronDown,
  ArrowUpRight,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Visual helpers                                                      */
/* ------------------------------------------------------------------ */

const statusConfig: Record<
  Ocorrencia["status"],
  { label: string; color: string; icon: React.ReactNode }
> = {
  ABERTA: {
    label: "Aberta",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  },
  EM_ANALISE: {
    label: "Em Análise",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  RESOLVIDA: {
    label: "Resolvida",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  ENCERRADA: {
    label: "Encerrada",
    color: "bg-slate-100 text-slate-600 border-slate-200",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
};

const prioridadeConfig: Record<
  Ocorrencia["prioridade"],
  { label: string; color: string }
> = {
  BAIXA: { label: "Baixa", color: "bg-sky-100 text-sky-700 border-sky-200" },
  MEDIA: {
    label: "Média",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  ALTA: {
    label: "Alta",
    color: "bg-orange-100 text-orange-700 border-orange-200",
  },
  CRITICA: {
    label: "Crítica",
    color: "bg-red-100 text-red-800 border-red-300",
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function OcorrenciasPage() {
  const { user } = useAuthStore();

  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState<Ocorrencia["prioridade"]>("MEDIA");
  const [submitting, setSubmitting] = useState(false);

  // Detail panel
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [loadingComentarios, setLoadingComentarios] = useState(false);
  const [novoComentario, setNovoComentario] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  const fetchOcorrencias = useCallback(async () => {
    try {
      setLoading(true);
      const data = await occurrenceService.getOcorrencias();
      setOcorrencias(data);
      setError("");
    } catch {
      setError("Erro ao carregar ocorrências.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOcorrencias();
  }, [fetchOcorrencias]);

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await occurrenceService.createOcorrencia(
        titulo,
        descricao || null,
        prioridade
      );
      setTitulo("");
      setDescricao("");
      setPrioridade("MEDIA");
      setShowForm(false);
      fetchOcorrencias();
    } catch {
      setError("Erro ao criar ocorrência.");
    } finally {
      setSubmitting(false);
    }
  }

  async function loadComentarios(ocorrenciaId: string) {
    setLoadingComentarios(true);
    try {
      const data = await occurrenceService.getComentarios(ocorrenciaId);
      setComentarios(data);
    } catch {
      setComentarios([]);
    } finally {
      setLoadingComentarios(false);
    }
  }

  function handleSelectOcorrencia(id: string) {
    if (selectedId === id) {
      setSelectedId(null);
      return;
    }
    setSelectedId(id);
    loadComentarios(id);
  }

  async function handleEnviarComentario(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !novoComentario.trim()) return;
    setSendingComment(true);
    try {
      await occurrenceService.addComentario(selectedId, novoComentario);
      setNovoComentario("");
      loadComentarios(selectedId);
    } catch {
      // Error handling silenciado
    } finally {
      setSendingComment(false);
    }
  }

  const selected = ocorrencias.find((o) => o.id === selectedId);
  const canCreate =
    user?.perfil === "SOLICITANTE" || user?.perfil === "ADMINISTRADOR";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" />
            Ocorrências
          </h1>
          <p className="text-slate-500 mt-1">
            Gerencie e acompanhe suas ocorrências operacionais.
          </p>
        </div>
        {canCreate && (
          <Button
            onClick={() => setShowForm(!showForm)}
            className="shadow-sm h-10 px-4 text-sm font-semibold"
          >
            {showForm ? (
              <>
                <X className="h-4 w-4 mr-1.5" />
                Cancelar
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1.5" />
                Nova Ocorrência
              </>
            )}
          </Button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <Card className="border-primary/20 shadow-md animate-in slide-in-from-top-2 duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Registrar Nova Ocorrência</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCriar} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Título *
                </label>
                <Input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Descreva brevemente a ocorrência"
                  className="h-10"
                  required
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Descrição
                </label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Detalhes adicionais sobre a ocorrência..."
                  className="w-full min-h-[100px] rounded-md border border-input bg-input/20 px-3 py-2 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 resize-y"
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Prioridade *
                </label>
                <div className="relative">
                  <select
                    value={prioridade}
                    onChange={(e) =>
                      setPrioridade(e.target.value as Ocorrencia["prioridade"])
                    }
                    className="w-full h-10 rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 appearance-none cursor-pointer"
                    disabled={submitting}
                  >
                    <option value="BAIXA">Baixa</option>
                    <option value="MEDIA">Média</option>
                    <option value="ALTA">Alta</option>
                    <option value="CRITICA">Crítica</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                  disabled={submitting}
                  className="h-9 px-4"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting} className="h-9 px-4">
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-1.5" />
                      Criar Ocorrência
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
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
      {!loading && ocorrencias.length === 0 && (
        <div className="text-center py-16">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600">
            Nenhuma ocorrência encontrada
          </h3>
          <p className="text-slate-400 mt-1">
            {canCreate
              ? "Crie sua primeira ocorrência clicando no botão acima."
              : "Nenhuma ocorrência disponível para visualização."}
          </p>
        </div>
      )}

      {/* List */}
      {!loading && ocorrencias.length > 0 && (
        <div className="grid gap-4">
          {ocorrencias.map((oc) => {
            const sc = statusConfig[oc.status];
            const pc = prioridadeConfig[oc.prioridade];
            const isSelected = selectedId === oc.id;

            return (
              <Card
                key={oc.id}
                className={`transition-all duration-200 cursor-pointer hover:shadow-md ${
                  isSelected
                    ? "ring-2 ring-primary/30 shadow-md"
                    : "shadow-sm border-slate-200/60"
                }`}
                onClick={() => handleSelectOcorrencia(oc.id)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900 truncate">
                          {oc.titulo}
                        </h3>
                        <ArrowUpRight
                          className={`h-4 w-4 text-slate-400 transition-transform ${
                            isSelected ? "rotate-90" : ""
                          }`}
                        />
                      </div>
                      {oc.descricao && (
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                          {oc.descricao}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 mt-2">
                        Criada em {formatDate(oc.criadoEm)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${sc.color}`}
                      >
                        {sc.icon}
                        {sc.label}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${pc.color}`}
                      >
                        {pc.label}
                      </span>
                    </div>
                  </div>

                  {/* Detail panel */}
                  {isSelected && selected && (
                    <div
                      className="mt-4 pt-4 border-t border-slate-100 space-y-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Comentários */}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mb-3">
                          <MessageSquare className="h-4 w-4" />
                          Comentários
                        </h4>

                        {loadingComentarios ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                          </div>
                        ) : comentarios.length === 0 ? (
                          <p className="text-sm text-slate-400 py-2">
                            Nenhum comentário ainda.
                          </p>
                        ) : (
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {comentarios.map((c) => (
                              <div
                                key={c.id}
                                className="bg-slate-50 rounded-lg p-3"
                              >
                                <p className="text-sm text-slate-700">
                                  {c.conteudo}
                                </p>
                                <p className="text-xs text-slate-400 mt-1.5">
                                  {formatDate(c.criadoEm)}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* New comment form */}
                        <form
                          onSubmit={handleEnviarComentario}
                          className="flex gap-2 mt-3"
                        >
                          <Input
                            value={novoComentario}
                            onChange={(e) => setNovoComentario(e.target.value)}
                            placeholder="Adicionar comentário..."
                            className="h-9 flex-1"
                            disabled={sendingComment}
                          />
                          <Button
                            type="submit"
                            size="icon"
                            className="h-9 w-9 shrink-0"
                            disabled={sendingComment || !novoComentario.trim()}
                          >
                            {sendingComment ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        </form>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

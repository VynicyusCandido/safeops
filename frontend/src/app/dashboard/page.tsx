"use client";

import { useEffect, useState, useCallback } from "react";
import { occurrenceService } from "@/services/occurrence-service";
import type { Ocorrencia } from "../../../@types/occurrence";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Activity,
  Loader2,
  TrendingUp,
} from "lucide-react";

export default function DashboardPage() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await occurrenceService.getOcorrencias();
      setOcorrencias(data);
    } catch {
      // Silently handle — dashboard shows zeros
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const abertas = ocorrencias.filter((o) => o.status === "ABERTA").length;
  const emAnalise = ocorrencias.filter(
    (o) => o.status === "EM_ANALISE"
  ).length;
  const resolvidas = ocorrencias.filter(
    (o) => o.status === "RESOLVIDA"
  ).length;
  const encerradas = ocorrencias.filter(
    (o) => o.status === "ENCERRADA"
  ).length;
  const total = ocorrencias.length;

  const criticas = ocorrencias.filter(
    (o) =>
      o.prioridade === "CRITICA" &&
      o.status !== "RESOLVIDA" &&
      o.status !== "ENCERRADA"
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Activity className="h-8 w-8 text-primary" />
          Visão Geral
        </h1>
        <p className="text-slate-500">
          Métricas e status das ocorrências operacionais.
        </p>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 bg-slate-100/50 rounded-2xl border border-slate-200/60 shadow-sm space-y-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm border-slate-200/60 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Abertas
              </CardTitle>
              <div className="bg-destructive/10 p-2.5 rounded-md">
                <AlertCircle className="h-4 w-4 text-destructive" />
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-4">
              <div className="text-3xl font-bold text-slate-900">{abertas}</div>
              <p className="text-xs text-slate-500 mt-2">Aguardando triagem</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200/60 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Em Análise
              </CardTitle>
              <div className="bg-amber-500/10 p-2.5 rounded-md">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-4">
              <div className="text-3xl font-bold text-slate-900">{emAnalise}</div>
              <p className="text-xs text-slate-500 mt-2">Sendo tratadas</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200/60 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Resolvidas
              </CardTitle>
              <div className="bg-emerald-500/10 p-2.5 rounded-md">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-4">
              <div className="text-3xl font-bold text-slate-900">
                {resolvidas}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Ocorrências finalizadas
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200/60 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Encerradas
              </CardTitle>
              <div className="bg-slate-500/10 p-2.5 rounded-md">
                <XCircle className="h-4 w-4 text-slate-600" />
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-4">
              <div className="text-3xl font-bold text-slate-900">
                {encerradas}
              </div>
              <p className="text-xs text-slate-500 mt-2">Casos encerrados</p>
            </CardContent>
          </Card>
        </div>

        {/* Summary row */}
        <div className="grid gap-6 sm:grid-cols-2">
          <Card className="shadow-sm border-slate-200/60">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4" />
                Resumo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Total de ocorrências</span>
                <span className="text-sm font-bold text-slate-900">{total}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Em andamento</span>
                <span className="text-sm font-bold text-amber-600">
                  {abertas + emAnalise}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-slate-600">Taxa de resolução</span>
                <span className="text-sm font-bold text-emerald-600">
                  {total > 0
                    ? Math.round(
                        ((resolvidas + encerradas) / total) * 100
                      )
                    : 0}
                  %
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Critical alerts */}
          <Card className="shadow-sm border-slate-200/60">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-red-500" />
                Ocorrências Críticas Ativas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {criticas.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-emerald-600 py-3">
                  <CheckCircle2 className="h-4 w-4" />
                  Nenhuma ocorrência crítica no momento.
                </div>
              ) : (
                <div className="space-y-3">
                  {criticas.slice(0, 5).map((oc) => (
                    <div
                      key={oc.id}
                      className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                    >
                      <span className="text-sm text-slate-700 truncate max-w-[250px]">
                        {oc.titulo}
                      </span>
                      <span className="text-xs font-medium text-red-600 bg-red-50 px-2.5 py-1 rounded-full shrink-0">
                        Crítica
                      </span>
                    </div>
                  ))}
                  {criticas.length > 5 && (
                    <p className="text-xs text-slate-400 pt-2">
                      +{criticas.length - 5} mais...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

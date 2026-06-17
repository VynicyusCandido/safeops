import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Clock, XCircle, Activity } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Activity className="h-8 w-8 text-primary" />
          Visão Geral
        </h1>
        <p className="text-slate-500">Métricas e status das ocorrências operacionais.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-slate-200/60 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Abertas</CardTitle>
            <div className="bg-destructive/10 p-2 rounded-md">
              <AlertCircle className="h-4 w-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">12</div>
            <p className="text-xs text-slate-500 mt-1">Aguardando triagem</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-slate-200/60 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Em Análise</CardTitle>
            <div className="bg-amber-500/10 p-2 rounded-md">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">4</div>
            <p className="text-xs text-slate-500 mt-1">Sendo tratadas</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200/60 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Resolvidas</CardTitle>
            <div className="bg-emerald-500/10 p-2 rounded-md">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">128</div>
            <p className="text-xs text-slate-500 mt-1">Ocorrências finalizadas</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200/60 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Canceladas</CardTitle>
            <div className="bg-slate-500/10 p-2 rounded-md">
              <XCircle className="h-4 w-4 text-slate-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">2</div>
            <p className="text-xs text-slate-500 mt-1">Falsos positivos</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

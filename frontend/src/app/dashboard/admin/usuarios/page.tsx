"use client";

import { useEffect, useState, useCallback } from "react";
import { userService } from "@/services/user-service";
import type { User as Usuario } from "../../../../../@types/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Plus,
  X,
  Loader2,
  AlertCircle,
  UserCheck,
  UserX,
  Shield,
  ChevronDown,
} from "lucide-react";



const perfilConfig: Record<
  Usuario["perfil"],
  { label: string; color: string }
> = {
  ADMINISTRADOR: {
    label: "Administrador",
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
  ANALISTA: {
    label: "Analista",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  SOLICITANTE: {
    label: "Solicitante",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
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

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState<Usuario["perfil"]>("SOLICITANTE");
  const [submitting, setSubmitting] = useState(false);

  // Toggle ativo
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      const data = await userService.getUsuarios();
      setUsuarios(data);
      setError("");
    } catch {
      setError("Erro ao carregar usuários.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await userService.createUsuario(nome, email, senha, perfil);
      setNome("");
      setEmail("");
      setSenha("");
      setPerfil("SOLICITANTE");
      setShowForm(false);
      fetchUsuarios();
    } catch (err: unknown) {
      const error = err as { status?: number };
      if (error.status === 409) {
        setError("Este e-mail já está cadastrado.");
      } else {
        setError("Erro ao criar usuário.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleAtivo(usuario: Usuario) {
    setTogglingId(usuario.id);
    try {
      await userService.toggleUsuarioStatus(usuario.id, !usuario.ativo);
      fetchUsuarios();
    } catch {
      setError("Erro ao alterar status do usuário.");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="h-7 w-7 text-purple-600" />
            Gerenciar Usuários
          </h1>
          <p className="text-slate-500 mt-1">
            Crie e gerencie os usuários do sistema.
          </p>
        </div>
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
              Novo Usuário
            </>
          )}
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <Card className="border-purple-200/60 shadow-md animate-in slide-in-from-top-2 duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Cadastrar Novo Usuário</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCriar} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Nome completo *
                  </label>
                  <Input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Nome do usuário"
                    className="h-10"
                    required
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    E-mail *
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@empresa.com"
                    className="h-10"
                    required
                    disabled={submitting}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Senha inicial *
                  </label>
                  <Input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="h-10"
                    required
                    minLength={8}
                    disabled={submitting}
                  />
                  <p className="text-xs text-slate-400">
                    O usuário será obrigado a trocar a senha no primeiro acesso.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Perfil *
                  </label>
                  <div className="relative">
                    <select
                      value={perfil}
                      onChange={(e) =>
                        setPerfil(e.target.value as Usuario["perfil"])
                      }
                      className="w-full h-9 rounded-md border border-input bg-white px-3 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 appearance-none cursor-pointer transition-colors"
                      disabled={submitting}
                    >
                      <option value="SOLICITANTE">Solicitante</option>
                      <option value="ANALISTA">Analista</option>
                      <option value="ADMINISTRADOR">Administrador</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                  disabled={submitting}
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
                      Criar Usuário
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
      {!loading && usuarios.length === 0 && (
        <div className="text-center py-16">
          <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600">
            Nenhum usuário cadastrado
          </h3>
        </div>
      )}

      {/* User table */}
      {!loading && usuarios.length > 0 && (
        <Card className="shadow-sm border-slate-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">
                    Nome
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">
                    E-mail
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">
                    Perfil
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">
                    Criado em
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-600">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => {
                  const pc = perfilConfig[u.perfil];

                  return (
                    <tr
                      key={u.id}
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0">
                            {u.nome.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-900">
                            {u.nome}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{u.email}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${pc.color}`}
                        >
                          <Shield className="h-3 w-3" />
                          {pc.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {u.ativo ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-medium">
                            <UserCheck className="h-3.5 w-3.5" />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium">
                            <UserX className="h-3.5 w-3.5" />
                            Inativo
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">
                        {formatDate(u.criadoEm)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant={u.ativo ? "destructive" : "secondary"}
                          size="sm"
                          onClick={() => handleToggleAtivo(u)}
                          disabled={togglingId === u.id}
                          className="text-xs h-7"
                        >
                          {togglingId === u.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : u.ativo ? (
                            <>
                              <UserX className="h-3 w-3 mr-1" />
                              Desativar
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-3 w-3 mr-1" />
                              Ativar
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

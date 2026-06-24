"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { ShieldCheck, AlertCircle, KeyRound, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { authService } from "@/services/auth-service";

type LoginStep = "credentials" | "change-password";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();

  const [step, setStep] = useState<LoginStep>("credentials");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, senha);
      router.push("/dashboard");
    } catch (err: unknown) {
      const error = err as { status?: number; body?: { reason?: string } };
      if (error.status === 403 && error.body?.reason === "PASSWORD_CHANGE_REQUIRED") {
        setStep("change-password");
      } else if (error.status === 401) {
        setError("E-mail ou senha inválidos.");
      } else {
        setError("Erro ao conectar com o servidor. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (novaSenha !== confirmarSenha) {
      setError("As senhas não coincidem.");
      return;
    }

    if (novaSenha.length < 8) {
      setError("A nova senha deve ter no mínimo 8 caracteres.");
      return;
    }

    setLoading(true);

    try {
      await authService.changePassword(email, senha, novaSenha);
      // Após troca de senha, o cookie já é enviado — buscar dados do usuário
      await login(email, novaSenha);
      router.push("/dashboard");
    } catch (err: unknown) {
      const error = err as { status?: number };
      if (error.status === 400) {
        setError("Senha atual inválida ou nova senha não atende aos requisitos.");
      } else {
        setError("Erro ao alterar a senha. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 p-6 sm:p-12">
      <div className="w-full max-w-2xl flex justify-center">
        <Card className="w-full max-w-md shadow-xl border-0 ring-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="space-y-4 text-center p-8 pb-6">
            <div className="flex justify-center">
              <div className="bg-primary/10 p-4 rounded-full animate-pulse-slow">
                {step === "credentials" ? (
                  <ShieldCheck className="w-10 h-10 text-primary" />
                ) : (
                  <KeyRound className="w-10 h-10 text-amber-600" />
                )}
              </div>
            </div>
            <div>
              <CardTitle className="text-3xl font-bold tracking-tight">
                SafeOps
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {step === "credentials"
                  ? "Autentique-se para gerenciar ocorrências"
                  : "Troca de senha obrigatória"}
              </CardDescription>
            </div>
          </CardHeader>

          {step === "credentials" ? (
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-6 p-8 py-2">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-semibold leading-none text-slate-700"
                  >
                    E-mail
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nome@empresa.com"
                    className="h-12 text-base"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold leading-none text-slate-700"
                  >
                    Senha
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className="h-12 text-base pr-10"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-8 pt-6">
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-bold shadow-md"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar no sistema"
                  )}
                </Button>
              </CardFooter>
            </form>
          ) : (
            <form onSubmit={handleChangePassword}>
              <CardContent className="space-y-5 p-8 py-2">
                <div className="p-3 bg-amber-50 text-amber-800 rounded-lg text-sm border border-amber-200">
                  <p className="font-medium">Primeiro acesso detectado</p>
                  <p className="mt-1 text-amber-700">
                    Defina uma nova senha para continuar.
                  </p>
                </div>
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <div className="space-y-2">
                  <label
                    htmlFor="newPassword"
                    className="text-sm font-semibold leading-none text-slate-700"
                  >
                    Nova senha
                  </label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      className="h-12 text-base pr-10"
                      placeholder="Mínimo 8 caracteres"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      required
                      minLength={8}
                      autoFocus
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      tabIndex={-1}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm font-semibold leading-none text-slate-700"
                  >
                    Confirmar nova senha
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    className="h-12 text-base"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    required
                    minLength={8}
                    disabled={loading}
                  />
                </div>
              </CardContent>
              <CardFooter className="p-8 pt-6 flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-bold shadow-md"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Alterando...
                    </>
                  ) : (
                    "Alterar senha e entrar"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-sm text-slate-500"
                  onClick={() => {
                    setStep("credentials");
                    setError("");
                    setNovaSenha("");
                    setConfirmarSenha("");
                  }}
                  disabled={loading}
                >
                  Voltar ao login
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/store/ui-store";
import { useAuthStore } from "@/store/auth-store";
import { Menu, UserCircle, LogOut, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const perfilLabels: Record<string, string> = {
  ADMINISTRADOR: "Admin",
  ANALISTA: "Analista",
  SOLICITANTE: "Solicitante",
};

const perfilColors: Record<string, string> = {
  ADMINISTRADOR: "bg-purple-100 text-purple-700 border-purple-200",
  ANALISTA: "bg-blue-100 text-blue-700 border-blue-200",
  SOLICITANTE: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export function Header() {
  const router = useRouter();
  const { toggleSidebar } = useUIStore();
  const { user, loading, fetchMe, logout } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // Mesmo se falhar, limpar estado local
    }
    router.push("/login");
  }

  return (
    <header className="h-16 border-b border-slate-200/60 bg-white/80 backdrop-blur-sm flex items-center justify-between px-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <div className="flex-1"></div>
      <div className="flex items-center gap-3">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        ) : user ? (
          <>
            <div className="hidden sm:flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                  perfilColors[user.perfil] ?? "bg-slate-100 text-slate-600"
                }`}
              >
                <Shield className="h-3 w-3" />
                {perfilLabels[user.perfil] ?? user.perfil}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <UserCircle className="h-7 w-7 text-slate-400" />
              <span className="text-sm font-medium text-slate-700 hidden sm:inline">
                {user.nome}
              </span>
            </div>
            <div className="w-px h-6 bg-slate-200 hidden sm:block" />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </>
        ) : null}
      </div>
    </header>
  );
}

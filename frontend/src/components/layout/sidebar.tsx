"use client";

import Link from "next/link";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FileText, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const { isSidebarOpen, closeSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-50 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
        !isSidebarOpen && "-translate-x-full"
      )}
    >
      <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
        <span className="text-xl font-bold">SafeOps</span>
        <Button variant="ghost" size="icon" className="lg:hidden text-slate-50 hover:bg-slate-800" onClick={closeSidebar}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      <nav className="p-4 space-y-2">
        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md bg-slate-800 text-white">
          <LayoutDashboard className="h-5 w-5" />
          Dashboard
        </Link>
        <Link href="/dashboard/ocorrencias" className="flex items-center gap-3 px-3 py-2 rounded-md text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
          <FileText className="h-5 w-5" />
          Ocorrências
        </Link>
        <Link href="/dashboard/configuracoes" className="flex items-center gap-3 px-3 py-2 rounded-md text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
          <Settings className="h-5 w-5" />
          Configurações
        </Link>
      </nav>
    </aside>
  );
}

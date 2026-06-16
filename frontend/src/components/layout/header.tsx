"use client";

import { useUIStore } from "@/store/ui-store";
import { Menu, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const { toggleSidebar } = useUIStore();

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6">
      <Button variant="ghost" size="icon" onClick={toggleSidebar} className="lg:hidden">
        <Menu className="h-5 w-5" />
      </Button>
      <div className="flex-1"></div>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-slate-700">Usuário Teste</span>
        <UserCircle className="h-8 w-8 text-slate-400" />
      </div>
    </header>
  );
}

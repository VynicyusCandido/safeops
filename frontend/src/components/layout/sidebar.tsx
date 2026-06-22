"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/store/ui-store";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Users,
  ScrollText,
  X,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    href: "/dashboard/ocorrencias",
    label: "Ocorrências",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    href: "/dashboard/admin/usuarios",
    label: "Usuários",
    icon: <Users className="h-5 w-5" />,
    adminOnly: true,
  },
  {
    href: "/dashboard/admin/logs",
    label: "Logs de Auditoria",
    icon: <ScrollText className="h-5 w-5" />,
    adminOnly: true,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, closeSidebar } = useUIStore();
  const { user } = useAuthStore();

  const isAdmin = user?.perfil === "ADMINISTRADOR";

  const filteredItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  // Separate regular and admin items for visual grouping
  const regularItems = filteredItems.filter((item) => !item.adminOnly);
  const adminItems = filteredItems.filter((item) => item.adminOnly);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-50 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 flex flex-col",
          !isSidebarOpen && "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
            <span className="text-xl font-bold">SafeOps</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-slate-50 hover:bg-slate-800"
            onClick={closeSidebar}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {regularItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeSidebar}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive(item.href)
                  ? "bg-emerald-600/20 text-emerald-400 shadow-sm"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}

          {/* Admin section */}
          {adminItems.length > 0 && (
            <>
              <div className="pt-4 pb-1 px-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Administração
                </p>
              </div>
              {adminItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeSidebar}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive(item.href)
                      ? "bg-purple-600/20 text-purple-400 shadow-sm"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* Bottom user info */}
        {user && (
          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-300">
                {user.nome.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">
                  {user.nome}
                </p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  TrendingUp,
  Settings,
  Scale,
  X,
  Calculator,
  Briefcase,
  Calendar,
  Wallet,
  Bot,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const navGroups = [
  {
    label: null,
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Jurídico",
    items: [
      { href: "/analyses", label: "Revisional", icon: FileText },
      { href: "/calculations", label: "Cálculos", icon: Calculator },
      { href: "/processes", label: "Processos", icon: Briefcase },
      { href: "/calendar", label: "Calendário", icon: Calendar },
    ],
  },
  {
    label: "Escritório",
    items: [
      { href: "/clients", label: "Clientes", icon: Users },
      { href: "/finances", label: "Financeiro", icon: Wallet },
      { href: "/rates", label: "Taxas BCB", icon: TrendingUp },
    ],
  },
  {
    label: "Ferramentas",
    items: [
      { href: "/ai", label: "IA Jurídica", icon: Bot },
      { href: "/community", label: "Comunidade", icon: BookOpen },
    ],
  },
  {
    label: null,
    items: [
      { href: "/settings", label: "Configurações", icon: Settings },
    ],
  },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 flex-col border-r border-border bg-sidebar",
          "flex flex-col",
          "lg:relative lg:z-auto lg:flex",
          open ? "flex" : "hidden lg:flex"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <Scale className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">JusCalc</p>
            <p className="text-xs text-muted-foreground truncate">Plataforma Jurídica</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 lg:hidden"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-2 py-3">
          <nav className="space-y-4">
            {navGroups.map((group, gi) => (
              <div key={gi} className="space-y-0.5">
                {group.label && (
                  <p className="px-3 pb-1 text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
                    {group.label}
                  </p>
                )}
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-accent/10 text-accent"
                          : "text-sidebar-foreground/70 hover:bg-muted hover:text-sidebar-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">JusCalc v2.0</p>
        </div>
      </aside>
    </>
  );
}

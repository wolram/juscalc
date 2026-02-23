"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, LogOut, Moon, Sun, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";

interface TopbarProps {
  onMenuClick: () => void;
  userEmail?: string | null;
  onOpenSearch?: () => void;
}

export function Topbar({ onMenuClick, userEmail, onOpenSearch }: TopbarProps) {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(true);

  function toggleTheme() {
    const html = document.documentElement;
    if (html.classList.contains("dark")) {
      html.classList.remove("dark");
      setDarkMode(false);
    } else {
      html.classList.add("dark");
      setDarkMode(true);
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Sessão encerrada com sucesso.");
    router.push("/login");
    router.refresh();
  }

  const initials = userEmail
    ? userEmail.slice(0, 2).toUpperCase()
    : "US";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 backdrop-blur-sm px-4">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden h-8 w-8"
        onClick={onMenuClick}
      >
        <Menu className="h-4 w-4" />
      </Button>

      <div className="flex-1" />

      {/* Busca rápida */}
      <Button
        variant="outline"
        size="sm"
        className="hidden sm:flex items-center gap-2 text-muted-foreground w-52 justify-between"
        onClick={onOpenSearch}
      >
        <span className="flex items-center gap-2">
          <Search className="h-3.5 w-3.5" />
          <span className="text-sm">Buscar...</span>
        </span>
        <kbd className="pointer-events-none text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
          ⌘K
        </kbd>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={toggleTheme}
      >
        {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium truncate">{userEmail}</p>
            <p className="text-xs text-muted-foreground">Administrador</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

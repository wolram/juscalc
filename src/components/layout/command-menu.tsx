"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  FileText,
  Users,
  TrendingUp,
  Settings,
  Plus,
} from "lucide-react";

interface CommandMenuProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CommandMenu({ open: controlledOpen, onOpenChange }: CommandMenuProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);

  function navigate(path: string) {
    router.push(path);
    setOpen(false);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="O que você procura?" />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

        <CommandGroup heading="Navegação">
          <CommandItem onSelect={() => navigate("/dashboard")}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </CommandItem>
          <CommandItem onSelect={() => navigate("/analyses")}>
            <FileText className="mr-2 h-4 w-4" />
            Análises
          </CommandItem>
          <CommandItem onSelect={() => navigate("/clients")}>
            <Users className="mr-2 h-4 w-4" />
            Clientes
          </CommandItem>
          <CommandItem onSelect={() => navigate("/rates")}>
            <TrendingUp className="mr-2 h-4 w-4" />
            Taxas BCB
          </CommandItem>
          <CommandItem onSelect={() => navigate("/settings")}>
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Ações rápidas">
          <CommandItem onSelect={() => navigate("/analyses/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Análise
          </CommandItem>
          <CommandItem onSelect={() => navigate("/clients?new=1")}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

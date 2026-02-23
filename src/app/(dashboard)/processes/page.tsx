import { Suspense } from "react";
import Link from "next/link";
import { Plus, Briefcase, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { listProcesses } from "@/services/process.service";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  ACTIVE: { label: "Ativo", variant: "default" },
  SUSPENDED: { label: "Suspenso", variant: "secondary" },
  ARCHIVED: { label: "Arquivado", variant: "outline" },
  CLOSED: { label: "Encerrado", variant: "destructive" },
};

const TYPE_LABELS: Record<string, string> = {
  CIVIL: "Cível",
  CRIMINAL: "Criminal",
  TRABALHISTA: "Trabalhista",
  PREVIDENCIARIO: "Previdenciário",
  TRIBUTARIO: "Tributário",
  FAMILIA: "Família",
  CONSUMIDOR: "Consumidor",
};

async function ProcessesList() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const member = await prisma.member.findFirst({
    where: { userId: user.id },
  });
  if (!member) return null;

  const { data: processes, total } = await listProcesses(member.organizationId);

  if (processes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12">
          <Briefcase className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Nenhum processo cadastrado</p>
          <Link href="/processes/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Novo processo
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {processes.map((p) => {
        const statusInfo = STATUS_LABELS[p.status] ?? STATUS_LABELS.ACTIVE!;
        const proximoPrazo = p.deadlines[0];

        return (
          <Link key={p.id} href={`/processes/${p.id}`}>
            <Card className="hover:border-primary/40 transition-colors">
              <CardContent className="flex items-center gap-4 py-3 px-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate">{p.subject}</span>
                    <Badge variant={statusInfo.variant} className="text-xs">
                      {statusInfo.label}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {TYPE_LABELS[p.type] ?? p.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                    <span>{p.client.name}</span>
                    <span className="font-mono">{p.cnjNumber}</span>
                    <span>{p.court}</span>
                  </div>
                </div>
                {proximoPrazo && (
                  <div className="flex items-center gap-1.5 text-xs text-orange-500 whitespace-nowrap">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      {new Date(proximoPrazo.dueDate).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        );
      })}
      <p className="text-xs text-muted-foreground text-right">
        {total} processo{total !== 1 ? "s" : ""} no total
      </p>
    </div>
  );
}

export default function ProcessesPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Processos</h1>
          <p className="text-muted-foreground text-sm">Gestão processual e prazos</p>
        </div>
        <Link href="/processes/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Novo processo
          </Button>
        </Link>
      </div>

      <Suspense fallback={<div className="h-32 animate-pulse rounded-md bg-muted" />}>
        <ProcessesList />
      </Suspense>
    </div>
  );
}

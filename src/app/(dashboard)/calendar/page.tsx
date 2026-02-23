import { Suspense } from "react";
import Link from "next/link";
import { Calendar, Clock, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { getUpcomingDeadlines } from "@/services/process.service";
import type { DeadlineWithProcess } from "@/services/process.service";

const TIPO_LABEL: Record<string, string> = {
  MANIFESTATION: "Manifestação",
  HEARING:       "Audiência",
  APPEAL:        "Recurso",
  DOCUMENT:      "Documento",
  OTHER:         "Outro",
};

async function CalendarContent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const member = await prisma.member.findFirst({ where: { userId: user.id } });
  if (!member) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <Calendar className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            Você ainda não está vinculado a uma organização.
          </p>
          <Button asChild size="sm">
            <Link href="/onboarding">Criar organização</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const deadlines = await getUpcomingDeadlines(member.organizationId, 60);

  if (deadlines.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <Calendar className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Nenhum evento nos próximos 60 dias</p>
          <Button asChild size="sm">
            <Link href="/calendar/new">
              <Plus className="h-4 w-4 mr-1" />
              Adicionar evento
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const groups = new Map<string, DeadlineWithProcess[]>();
  for (const d of deadlines) {
    const key = new Date(d.dueDate).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(d);
  }

  return (
    <div className="space-y-6">
      {Array.from(groups.entries()).map(([month, items]) => (
        <div key={month}>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 capitalize">
            {month}
          </h2>
          <div className="space-y-1.5">
            {items.map((d) => {
              const hoje = new Date();
              const venc = new Date(d.dueDate);
              const diasRestantes = Math.ceil(
                (venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
              );
              const urgente = diasRestantes <= 5;

              const href = d.process ? `/processes/${d.process.id}` : "#";

              return (
                <Link key={d.id} href={href}>
                  <Card
                    className={`transition-colors hover:border-primary/40 ${
                      urgente ? "border-orange-500/40" : ""
                    }`}
                  >
                    <CardContent className="flex items-center gap-3 py-3 px-4">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          urgente ? "bg-orange-500/10" : "bg-muted"
                        }`}
                      >
                        <Clock
                          className={`h-4 w-4 ${
                            urgente ? "text-orange-500" : "text-muted-foreground"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{d.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {d.process
                            ? `${d.process.subject} — ${d.process.cnjNumber}`
                            : TIPO_LABEL[d.type] ?? d.type}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm font-medium">
                          {venc.toLocaleDateString("pt-BR")}
                        </span>
                        <Badge
                          variant={urgente ? "destructive" : "outline"}
                          className="text-xs"
                        >
                          {diasRestantes === 0
                            ? "Hoje"
                            : diasRestantes === 1
                            ? "Amanhã"
                            : `${diasRestantes} dias`}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CalendarPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendário</h1>
          <p className="text-muted-foreground text-sm">Prazos e audiências dos próximos 60 dias</p>
        </div>
        <Button asChild size="sm">
          <Link href="/calendar/new">
            <Plus className="h-4 w-4 mr-2" />
            Novo Evento
          </Link>
        </Button>
      </div>

      <Suspense fallback={<div className="h-32 animate-pulse rounded-md bg-muted" />}>
        <CalendarContent />
      </Suspense>
    </div>
  );
}

import { Suspense } from "react";
import Link from "next/link";
import { Plus, TrendingUp, TrendingDown, DollarSign, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { listFinances, getSummary } from "@/services/finance.service";
import { formatBRL } from "@/lib/formatters";

const STATUS_LABELS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  PENDING: { label: "Pendente", variant: "secondary" },
  PAID: { label: "Pago", variant: "default" },
  OVERDUE: { label: "Vencido", variant: "destructive" },
  CANCELLED: { label: "Cancelado", variant: "outline" },
};

async function FinancesContent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const member = await prisma.member.findFirst({ where: { userId: user.id } });
  if (!member) return null;

  const [summary, { data: finances }] = await Promise.all([
    getSummary(member.organizationId),
    listFinances(member.organizationId),
  ]);

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Receitas (mês)",
            value: formatBRL(summary.totalReceitas),
            icon: TrendingUp,
            color: "text-green-500",
          },
          {
            label: "Despesas (mês)",
            value: formatBRL(summary.totalDespesas),
            icon: TrendingDown,
            color: "text-red-500",
          },
          {
            label: "Saldo",
            value: formatBRL(summary.saldo),
            icon: DollarSign,
            color: summary.saldo >= 0 ? "text-green-500" : "text-red-500",
          },
          {
            label: "Inadimplência",
            value: formatBRL(summary.inadimplencia),
            icon: AlertCircle,
            color: "text-orange-500",
          },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-1 pt-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {kpi.label}
                </CardTitle>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </CardHeader>
            <CardContent className="pb-3 px-4">
              <p className="text-xl font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Listagem */}
      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between">
          <CardTitle className="text-base">Lançamentos</CardTitle>
          <Link href="/finances/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Novo
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {finances.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Nenhum lançamento cadastrado
            </p>
          ) : (
            <div className="divide-y divide-border">
              {finances.map((f) => {
                const statusInfo = STATUS_LABELS[f.status] ?? STATUS_LABELS.PENDING!;
                const isReceita = f.type === "INCOME";

                return (
                  <div
                    key={f.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        isReceita ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{f.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {f.category} · {new Date(f.dueDate).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-semibold ${
                          isReceita ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {isReceita ? "+" : "-"}{formatBRL(Number(f.amount))}
                      </span>
                      <Badge variant={statusInfo.variant} className="text-xs">
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function FinancesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <p className="text-muted-foreground text-sm">Honorários e fluxo de caixa</p>
      </div>

      <Suspense fallback={<div className="h-64 animate-pulse rounded-md bg-muted" />}>
        <FinancesContent />
      </Suspense>
    </div>
  );
}

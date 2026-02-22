import { Suspense } from "react";
import Link from "next/link";
import { FileText, Users, CheckCircle, TrendingUp, Plus, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getDashboardStats, listAnalyses } from "@/services/analysis.service";
import { formatBRL, formatDate } from "@/lib/formatters";

async function DashboardContent() {
  const [stats, { data: recentAnalyses }] = await Promise.all([
    getDashboardStats(),
    listAnalyses(1, 5),
  ]);

  const kpis = [
    {
      label: "Total de Análises",
      value: stats.totalAnalyses,
      icon: FileText,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Clientes Cadastrados",
      value: stats.totalClients,
      icon: Users,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
    },
    {
      label: "Análises Finalizadas",
      value: stats.totalFinalized,
      icon: CheckCircle,
      color: "text-green-400",
      bg: "bg-green-400/10",
    },
    {
      label: "Em Andamento",
      value: stats.totalAnalyses - stats.totalFinalized,
      icon: TrendingUp,
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Visão geral do escritório</p>
        </div>
        <Button asChild size="sm">
          <Link href="/analyses/new">
            <Plus className="h-4 w-4 mr-2" />
            Nova Análise
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${kpi.bg}`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">Análises Recentes</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/analyses" className="flex items-center gap-1 text-xs">
              Ver todas
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {recentAnalyses.length === 0 ? (
            <div className="px-4 pb-4 text-sm text-muted-foreground">
              Nenhuma análise cadastrada ainda.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentAnalyses.map((analysis) => (
                <Link
                  key={analysis.id}
                  href={`/analyses/${analysis.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{analysis.client.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {analysis.bank} — {formatDate(analysis.contractDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <span className="text-sm font-medium">{formatBRL(Number(analysis.releasedValue))}</span>
                    <Badge
                      variant={analysis.status === "FINALIZED" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {analysis.status === "FINALIZED" ? "Finalizado" : "Rascunho"}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground text-sm">Carregando...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

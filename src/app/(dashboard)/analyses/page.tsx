import { Suspense } from "react";
import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { listAnalyses } from "@/services/analysis.service";
import { formatBRL, formatDate, formatPercent } from "@/lib/formatters";

async function AnalysesList() {
  const { data: analyses, total } = await listAnalyses(1, 50);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Análises</h1>
          <p className="text-muted-foreground text-sm">{total} análises cadastradas</p>
        </div>
        <Button asChild size="sm">
          <Link href="/analyses/new">
            <Plus className="h-4 w-4 mr-2" />
            Nova Análise
          </Link>
        </Button>
      </div>

      {analyses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma análise cadastrada</p>
            <Button asChild size="sm" className="mt-4">
              <Link href="/analyses/new">Criar primeira análise</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border border-border overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-0 bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border">
            <span>Cliente</span>
            <span>Banco / Modalidade</span>
            <span className="text-right">Valor</span>
            <span className="text-right">Taxa</span>
            <span className="text-right">Status</span>
          </div>
          {analyses.map((analysis) => (
            <Link
              key={analysis.id}
              href={`/analyses/${analysis.id}`}
              className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-0 px-4 py-3 items-center hover:bg-muted/50 transition-colors border-b border-border last:border-0 text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{analysis.client.name}</p>
                <p className="text-xs text-muted-foreground">{formatDate(analysis.contractDate)}</p>
              </div>
              <div className="min-w-0">
                <p className="truncate">{analysis.bank}</p>
                <p className="text-xs text-muted-foreground truncate">{analysis.contractModality}</p>
              </div>
              <div className="text-right ml-4">
                <p className="font-medium">{formatBRL(Number(analysis.releasedValue))}</p>
                <p className="text-xs text-muted-foreground">
                  {analysis.installments}x {formatBRL(Number(analysis.installmentValue))}
                </p>
              </div>
              <div className="text-right ml-4">
                <p className="font-mono">{formatPercent(Number(analysis.contractedRate))}</p>
                <p className="text-xs text-muted-foreground">a.m.</p>
              </div>
              <div className="ml-4">
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
    </div>
  );
}

export default function AnalysesPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground text-sm">Carregando...</div>}>
      <AnalysesList />
    </Suspense>
  );
}

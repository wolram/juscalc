"use client";

import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ScenarioResult } from "@/lib/calculations";
import { formatBRL, formatPercent } from "@/lib/formatters";

interface ScenarioComparisonProps {
  scenarios: ScenarioResult[];
  contractedRate: number;
  analysisId: string;
}

const scenarioColors: Record<string, string> = {
  BCB_AVERAGE: "border-blue-500/30 bg-blue-500/5",
  FIXED_148: "border-green-500/30 bg-green-500/5",
  BCB_150: "border-yellow-500/30 bg-yellow-500/5",
  CUSTOM: "border-border bg-card",
};

export function ScenarioComparison({
  scenarios,
  contractedRate,
  analysisId,
}: ScenarioComparisonProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Taxa contratada:{" "}
        <span className="font-mono font-medium">{formatPercent(contractedRate)} a.m.</span>
        {" — "}Comparativo com 3 cenários de revisão
      </p>
      {scenarios.map((scenario) => (
        <Card
          key={scenario.type}
          className={`border ${scenarioColors[scenario.type] ?? "border-border bg-card"}`}
        >
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">{scenario.label}</CardTitle>
              <p className="text-xs text-muted-foreground font-mono">
                {formatPercent(scenario.rate)} a.m.
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
              <a
                href={`/api/analyses/${analysisId}/pdf?scenario=${scenario.type}`}
                target="_blank"
              >
                <Download className="h-3 w-3 mr-1" />
                PDF
              </a>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Parcela Recalculada</p>
                <p className="font-semibold">{formatBRL(scenario.installment)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Redução Mensal</p>
                <p
                  className={`font-semibold ${
                    scenario.monthlyDiff > 0 ? "text-green-400" : "text-muted-foreground"
                  }`}
                >
                  {scenario.monthlyDiff > 0 ? `- ${formatBRL(scenario.monthlyDiff)}` : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">% Redução</p>
                <p
                  className={`font-semibold ${
                    scenario.reductionPct > 0 ? "text-green-400" : "text-muted-foreground"
                  }`}
                >
                  {scenario.reductionPct > 0 ? `${scenario.reductionPct.toFixed(1)}%` : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Já Pago a Maior</p>
                <p
                  className={`font-semibold ${
                    scenario.overpaid > 0 ? "text-red-400" : "text-muted-foreground"
                  }`}
                >
                  {scenario.overpaid > 0 ? formatBRL(scenario.overpaid) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Economia Estimada</p>
                <p
                  className={`font-semibold ${
                    scenario.savings > 0 ? "text-green-400" : "text-muted-foreground"
                  }`}
                >
                  {scenario.savings > 0 ? formatBRL(scenario.savings) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total pelo Contrato</p>
                <p className="font-semibold">{formatBRL(scenario.totalDue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

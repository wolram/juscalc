import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAnalysisById } from "@/services/analysis.service";
import { getRateForMonth } from "@/services/rates.service";
import {
  calculateScenarios,
  getDiagnostic,
  generateConclusion,
  calculateTotalPaid,
  calculateRemainingBalance,
} from "@/lib/calculations";
import { ScenarioComparison } from "@/components/analyses/scenario-comparison";
import { formatBRL, formatDate, formatPercent, serializeAnalysis } from "@/lib/formatters";

export default async function AnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rawAnalysis = await getAnalysisById(id);
  if (!rawAnalysis) notFound();
  const analysis = serializeAnalysis(rawAnalysis);

  const contractDate = new Date(analysis.contractDate);
  const bcbRate = await getRateForMonth(contractDate.getMonth() + 1, contractDate.getFullYear());
  const bcbRateValue = bcbRate ? Number(bcbRate.rate) : 1.5;

  const contractInput = {
    releasedValue: analysis.releasedValue,
    installments: analysis.installments,
    installmentValue: analysis.installmentValue,
    contractedRate: analysis.contractedRate,
    installmentsPaid: analysis.installmentsPaid,
  };

  const scenarios = calculateScenarios(contractInput, bcbRateValue);
  const diagnostic = getDiagnostic(contractInput.contractedRate, bcbRateValue);
  const conclusion = generateConclusion(contractInput, bcbRateValue, scenarios);
  const totalPaid = calculateTotalPaid(contractInput.installmentValue, contractInput.installmentsPaid);
  const remainingBalance = calculateRemainingBalance(contractInput);

  const diagnosticColorMap = {
    green: "bg-green-500/10 text-green-400 border-green-500/20",
    yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8 mt-0.5">
          <Link href="/analyses">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold truncate">{analysis.client.name}</h1>
            <Badge variant={analysis.status === "FINALIZED" ? "default" : "secondary"}>
              {analysis.status === "FINALIZED" ? "Finalizado" : "Rascunho"}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {analysis.bank} — {analysis.contractModality}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={`/api/analyses/${id}/pdf`} target="_blank">
            <Download className="h-4 w-4 mr-2" />
            PDF Completo
          </a>
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="scenarios">Cenários</TabsTrigger>
          <TabsTrigger value="conclusion">Conclusão</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className={`rounded-lg border px-4 py-3 ${diagnosticColorMap[diagnostic.color]}`}>
            <p className="text-sm font-semibold">{diagnostic.label}</p>
            <p className="text-xs mt-0.5 opacity-80">{diagnostic.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Identificação do Contrato</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                {(
                  [
                    ["Banco", analysis.bank],
                    ["Modalidade", analysis.contractModality],
                    ...(analysis.vehicleModel ? [["Veículo", analysis.vehicleModel] as [string, string]] : []),
                    ["Data", formatDate(analysis.contractDate)],
                    ["Valor Financiado", formatBRL(analysis.releasedValue)],
                    ["Total de Parcelas", `${analysis.installments}x`],
                    ["Parcela", formatBRL(analysis.installmentValue)],
                    ["Taxa Contratada", `${formatPercent(analysis.contractedRate)} a.m.`],
                    ["Taxa BACEN (período)", `${formatPercent(bcbRateValue)} a.m.`],
                  ] as [string, string][]
                ).map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-2">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-right">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Informações Declaradas</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                {(
                  [
                    ["Parcelas Pagas", `${analysis.installmentsPaid}`],
                    ["Parcelas em Atraso", `${analysis.overdueInstallments}`],
                    ["Total Já Pago", formatBRL(totalPaid)],
                    ["Saldo Estimado", formatBRL(remainingBalance)],
                  ] as [string, string][]
                ).map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-2">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-right">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scenarios" className="mt-4">
          <ScenarioComparison
            scenarios={scenarios}
            contractedRate={contractInput.contractedRate}
            analysisId={id}
          />
        </TabsContent>

        <TabsContent value="conclusion" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Conclusão Automática</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                {conclusion}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

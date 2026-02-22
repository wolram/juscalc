"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Client } from "@/types";
import {
  calculatePriceTable,
  calculateTotalPaid,
  getDiagnostic,
} from "@/lib/calculations";
import { formatBRL, formatPercent } from "@/lib/formatters";

interface AnalysisFormProps {
  clients: Client[];
}

const MODALITIES = [
  "Financiamento de Veículo",
  "Crédito Pessoal",
  "Cartão de Crédito",
  "Consignado",
  "Outro",
];

export function AnalysisForm({ clients }: AnalysisFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedClientId = searchParams.get("clientId") ?? "";

  const [loading, setLoading] = useState(false);
  const [modality, setModality] = useState("Financiamento de Veículo");
  const [clientId, setClientId] = useState(preSelectedClientId);

  const [releasedValue, setReleasedValue] = useState(0);
  const [installments, setInstallments] = useState(0);
  const [installmentValue, setInstallmentValue] = useState(0);
  const [contractedRate, setContractedRate] = useState(0);
  const [installmentsPaid, setInstallmentsPaid] = useState(0);
  const [bcbRate, setBcbRate] = useState<number | null>(null);
  const [contractDate, setContractDate] = useState("");

  const totalPaid = calculateTotalPaid(installmentValue, installmentsPaid);
  const remainingInstallments = Math.max(0, installments - installmentsPaid);

  useEffect(() => {
    if (!contractDate) return;
    const date = new Date(contractDate);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    fetch(`/api/rates?month=${month}&year=${year}`)
      .then((r) => r.json())
      .then((data: { rate?: number }) => {
        if (data.rate) setBcbRate(data.rate);
        else setBcbRate(null);
      })
      .catch(() => null);
  }, [contractDate]);

  const bcbInstallment =
    bcbRate && releasedValue > 0 && installments > 0
      ? calculatePriceTable({
          principal: releasedValue,
          rate: bcbRate / 100,
          installments,
        }).installment
      : null;

  const diffBcb = bcbInstallment ? installmentValue - bcbInstallment : null;
  const overpaidBcb = diffBcb && installmentsPaid > 0 ? diffBcb * installmentsPaid : null;

  const diagnostic =
    bcbRate && contractedRate > 0 ? getDiagnostic(contractedRate, bcbRate) : null;

  const diagnosticColorMap = {
    green: "bg-green-500/10 text-green-400 border-green-500/20",
    yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!clientId) {
      toast.error("Selecione um cliente");
      return;
    }
    setLoading(true);

    const form = e.currentTarget;
    const data = {
      bank: (form.elements.namedItem("bank") as HTMLInputElement).value,
      contractNumber: (form.elements.namedItem("contractNumber") as HTMLInputElement).value,
      contractModality: modality,
      vehicleModel:
        modality === "Financiamento de Veículo"
          ? (form.elements.namedItem("vehicleModel") as HTMLInputElement).value || undefined
          : undefined,
      contractDate,
      releasedValue,
      installments,
      installmentValue,
      contractedRate,
      installmentsPaid,
      overdueInstallments:
        Number((form.elements.namedItem("overdueInstallments") as HTMLInputElement).value) || 0,
      clientId,
    };

    try {
      const res = await fetch("/api/analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Falha ao criar análise");

      const analysis = (await res.json()) as { id: string };
      toast.success("Análise criada com sucesso");
      router.push(`/analyses/${analysis.id}`);
    } catch {
      toast.error("Erro ao criar análise");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Seção 1 — Identificação */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">1 — Identificação do Contrato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Cliente *</Label>
              <Select value={clientId} onValueChange={setClientId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bank">Instituição Financeira *</Label>
              <Input id="bank" name="bank" required placeholder="Ex: Banco Santander" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Modalidade Contratual *</Label>
              <Select value={modality} onValueChange={setModality}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODALITIES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contractNumber">Número do Contrato</Label>
              <Input id="contractNumber" name="contractNumber" placeholder="Opcional" />
            </div>
          </div>

          {modality === "Financiamento de Veículo" && (
            <div className="space-y-1.5">
              <Label htmlFor="vehicleModel">Modelo do Veículo</Label>
              <Input
                id="vehicleModel"
                name="vehicleModel"
                placeholder="Ex: Honda Civic 2020"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="contractDate">Data da Contratação *</Label>
              <Input
                id="contractDate"
                name="contractDate"
                type="date"
                required
                value={contractDate}
                onChange={(e) => setContractDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="releasedValue">Valor Financiado (R$) *</Label>
              <Input
                id="releasedValue"
                name="releasedValue"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0,00"
                onChange={(e) => setReleasedValue(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="installments">Total de Parcelas *</Label>
              <Input
                id="installments"
                name="installments"
                type="number"
                min="1"
                required
                placeholder="Ex: 48"
                onChange={(e) => setInstallments(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contractedRate">Taxa de Juros (% a.m.) *</Label>
              <Input
                id="contractedRate"
                name="contractedRate"
                type="number"
                step="0.0001"
                min="0"
                required
                placeholder="Ex: 2.50"
                onChange={(e) => setContractedRate(Number(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seção 2 — Informações Declaradas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">2 — Informações Declaradas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="installmentValue">Valor da Parcela Atual (R$) *</Label>
              <Input
                id="installmentValue"
                name="installmentValue"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0,00"
                onChange={(e) => setInstallmentValue(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="installmentsPaid">Parcelas Pagas *</Label>
              <Input
                id="installmentsPaid"
                name="installmentsPaid"
                type="number"
                min="0"
                required
                placeholder="Ex: 12"
                onChange={(e) => setInstallmentsPaid(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Total Já Pago (calculado)</Label>
              <div className="flex h-9 items-center rounded-md border border-border bg-muted/50 px-3 text-sm font-medium">
                {formatBRL(totalPaid)}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="overdueInstallments">Parcelas em Atraso</Label>
              <Input
                id="overdueInstallments"
                name="overdueInstallments"
                type="number"
                min="0"
                defaultValue={0}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Parcelas Restantes</Label>
            <div className="flex h-9 items-center rounded-md border border-border bg-muted/50 px-3 text-sm font-medium">
              {remainingInstallments > 0 ? `${remainingInstallments} parcelas` : "—"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seção 3 — Preview BACEN (automático) */}
      {bcbRate && releasedValue > 0 && installmentValue > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">3 — Comparação BACEN (Prévia)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {diagnostic && (
              <div
                className={`rounded-lg border px-3 py-2 text-sm ${
                  diagnosticColorMap[diagnostic.color]
                }`}
              >
                <span className="font-medium">{diagnostic.label}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Taxa BACEN (período)</p>
                <p className="font-medium font-mono">{formatPercent(bcbRate)} a.m.</p>
              </div>
              {bcbInstallment && (
                <div>
                  <p className="text-xs text-muted-foreground">Parcela estimada BACEN</p>
                  <p className="font-medium">{formatBRL(bcbInstallment)}</p>
                </div>
              )}
              {diffBcb && diffBcb > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Diferença mensal</p>
                  <p className="font-medium text-red-400">+ {formatBRL(diffBcb)}</p>
                </div>
              )}
              {overpaidBcb && overpaidBcb > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Já pago a maior</p>
                  <p className="font-medium text-red-400">{formatBRL(overpaidBcb)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Salvando..." : "Criar Análise"}
        </Button>
      </div>
    </form>
  );
}

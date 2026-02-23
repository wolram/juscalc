"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { CalcResultCard } from "@/components/calculations/calc-result-card";
import { calcularRMI, TETO_RGPS_2025, SALARIO_MINIMO_2025 } from "@/lib/calc-previdenciario";
import type { RMIInput, RMIResult } from "@/lib/calc-previdenciario";
import { formatBRL } from "@/lib/formatters";

export default function PrevidenciarioPage() {
  const [result, setResult] = useState<RMIResult | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<RMIInput>({
    defaultValues: {
      sexo: "M",
      especieBeneficio: "APOSENTADORIA_TEMPO",
      idadeAnos: 65,
      totalContribuicoesMeses: 300,
      mediaContribuicoes: 3000,
      dataFiliacao: "2000-01-01",
    },
  });

  function calcular(data: RMIInput) {
    try {
      setResult(calcularRMI(data));
    } catch {
      toast.error("Erro no cálculo");
    }
  }

  async function salvar() {
    setSaving(true);
    try {
      await fetch("/api/calculations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "PREVIDENCIARIO", input: form.getValues(), result }),
      });
      toast.success("Cálculo salvo");
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Cálculos Previdenciários</h1>
        <p className="text-muted-foreground text-sm">
          Lei 8.213/91 — Teto RGPS 2025: {formatBRL(TETO_RGPS_2025)} | SM: {formatBRL(SALARIO_MINIMO_2025)}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Cálculo de RMI</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(calcular)} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Espécie do Benefício</Label>
                <Select
                  onValueChange={(v) =>
                    form.setValue("especieBeneficio", v as RMIInput["especieBeneficio"])
                  }
                  defaultValue="APOSENTADORIA_TEMPO"
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APOSENTADORIA_TEMPO">Aposentadoria por Tempo</SelectItem>
                    <SelectItem value="APOSENTADORIA_INVALIDEZ">Aposentadoria por Invalidez</SelectItem>
                    <SelectItem value="AUXILIO_DOENCA">Auxílio-Doença</SelectItem>
                    <SelectItem value="PENSAO_MORTE">Pensão por Morte</SelectItem>
                    <SelectItem value="LOAS_BPC">LOAS / BPC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Sexo</Label>
                  <Select
                    onValueChange={(v) => form.setValue("sexo", v as "M" | "F")}
                    defaultValue="M"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculino</SelectItem>
                      <SelectItem value="F">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Idade (anos)</Label>
                  <Input
                    type="number"
                    {...form.register("idadeAnos", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Média das contribuições (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...form.register("mediaContribuicoes", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Total de contribuições (meses)</Label>
                <Input
                  type="number"
                  {...form.register("totalContribuicoesMeses", { valueAsNumber: true })}
                />
              </div>

              <Button type="submit" className="w-full">
                Calcular RMI
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <CalcResultCard
            title="Resultado — RMI"
            rows={[
              { label: "Salário-de-benefício", value: formatBRL(result.salarioBeneficio) },
              {
                label: "Coeficiente",
                value: `${(result.coeficiente * 100).toFixed(2)}%`,
              },
              { label: "RMI calculada", value: formatBRL(result.rmi), highlight: true },
              {
                label: "Valor anual (13°)",
                value: formatBRL(result.rmi * 13),
              },
            ]}
            observations={result.observacoes}
            onSave={salvar}
            saving={saving}
          />
        )}
      </div>
    </div>
  );
}

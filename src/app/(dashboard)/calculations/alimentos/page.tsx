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
import { calcularAlimentos, SALARIO_MINIMO_2025 } from "@/lib/calc-alimentos";
import type { AlimentosInput, AlimentosResult } from "@/lib/calc-alimentos";
import { formatBRL } from "@/lib/formatters";

export default function AlimentosPage() {
  const [result, setResult] = useState<AlimentosResult | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<AlimentosInput>({
    defaultValues: {
      tipoCalculo: "PERCENTUAL_RENDA",
      numeroBeneficiarios: 1,
      percentualRenda: 30,
      rendaLiquidaAlimentante: 0,
    },
  });

  const tipo = form.watch("tipoCalculo");

  function calcular(data: AlimentosInput) {
    try {
      setResult(calcularAlimentos(data));
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
        body: JSON.stringify({ type: "ALIMENTOS", input: form.getValues(), result }),
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
        <h1 className="text-2xl font-bold">Cálculo de Alimentos</h1>
        <p className="text-muted-foreground text-sm">
          Quantum alimentar (CC art. 1.694) — SM atual: {formatBRL(SALARIO_MINIMO_2025)}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Parâmetros</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(calcular)} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Tipo de Cálculo</Label>
                <Select
                  onValueChange={(v) =>
                    form.setValue("tipoCalculo", v as AlimentosInput["tipoCalculo"])
                  }
                  defaultValue="PERCENTUAL_RENDA"
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTUAL_RENDA">% sobre a renda</SelectItem>
                    <SelectItem value="PERCENTUAL_SM">% do salário mínimo</SelectItem>
                    <SelectItem value="VALOR_FIXO">Valor fixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Renda líquida do alimentante (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...form.register("rendaLiquidaAlimentante", { valueAsNumber: true })}
                />
              </div>

              {tipo === "PERCENTUAL_RENDA" && (
                <div className="space-y-1.5">
                  <Label>Percentual sobre a renda (%)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    {...form.register("percentualRenda", { valueAsNumber: true })}
                  />
                </div>
              )}

              {tipo === "PERCENTUAL_SM" && (
                <div className="space-y-1.5">
                  <Label>Percentual do salário mínimo (%)</Label>
                  <Input
                    type="number"
                    step="5"
                    {...form.register("percentualSalarioMinimo", { valueAsNumber: true })}
                  />
                </div>
              )}

              {tipo === "VALOR_FIXO" && (
                <div className="space-y-1.5">
                  <Label>Valor fixo (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register("valorFixo", { valueAsNumber: true })}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Número de beneficiários</Label>
                <Input
                  type="number"
                  min="1"
                  {...form.register("numeroBeneficiarios", { valueAsNumber: true })}
                />
              </div>

              <Button type="submit" className="w-full">
                Calcular
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <CalcResultCard
            title="Resultado — Alimentos"
            rows={[
              { label: "Valor mensal total", value: formatBRL(result.valorMensal), highlight: true },
              {
                label: `Por beneficiário (${form.watch("numeroBeneficiarios")})`,
                value: formatBRL(result.valorPorBeneficiario),
              },
              {
                label: "% efetivo da renda",
                value: `${result.percentualEfetivo.toFixed(2)}%`,
              },
              {
                label: "Valor anual estimado",
                value: formatBRL(result.valorMensal * 12),
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

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalcResultCard } from "@/components/calculations/calc-result-card";
import { calcularAluguelAtrasado } from "@/lib/calc-aluguel";
import type { AluguelAtrasadoInput, AluguelAtrasadoResult } from "@/lib/calc-aluguel";
import { formatBRL } from "@/lib/formatters";

export default function AluguelPage() {
  const [result, setResult] = useState<AluguelAtrasadoResult | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<AluguelAtrasadoInput>({
    defaultValues: {
      multaContratual: 10,
      indiceCorrecao: "IGPM",
      incluirCondominio: false,
      incluirIPTU: false,
    },
  });

  function calcular(data: AluguelAtrasadoInput) {
    try {
      setResult(calcularAluguelAtrasado(data));
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
        body: JSON.stringify({ type: "ALUGUEL", input: form.getValues(), result }),
      });
      toast.success("Cálculo salvo");
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  const inclCondominio = form.watch("incluirCondominio");
  const inclIPTU = form.watch("incluirIPTU");

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Locatício — Aluguel em Atraso</h1>
        <p className="text-muted-foreground text-sm">Lei do Inquilinato (Lei 8.245/91)</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Dados do Débito</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(calcular)} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Valor do Aluguel (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...form.register("valorAluguel", { valueAsNumber: true })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Data de Vencimento</Label>
                  <Input type="date" {...form.register("dataVencimento")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Data do Pagamento/Cálculo</Label>
                  <Input type="date" {...form.register("dataPagamento")} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Multa contratual (%)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    {...form.register("multaContratual", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Índice de Correção</Label>
                  <Select
                    onValueChange={(v) =>
                      form.setValue(
                        "indiceCorrecao",
                        v as AluguelAtrasadoInput["indiceCorrecao"]
                      )
                    }
                    defaultValue="IGPM"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IGPM">IGP-M</SelectItem>
                      <SelectItem value="IPCA">IPCA</SelectItem>
                      <SelectItem value="INPC">INPC</SelectItem>
                      <SelectItem value="SELIC">SELIC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="condominio"
                  onCheckedChange={(v) => form.setValue("incluirCondominio", !!v)}
                />
                <Label htmlFor="condominio" className="font-normal cursor-pointer">
                  Incluir condomínio
                </Label>
              </div>

              {inclCondominio && (
                <div className="space-y-1.5">
                  <Label>Valor do Condomínio (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register("valorCondominio", { valueAsNumber: true })}
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <Checkbox
                  id="iptu"
                  onCheckedChange={(v) => form.setValue("incluirIPTU", !!v)}
                />
                <Label htmlFor="iptu" className="font-normal cursor-pointer">
                  Incluir IPTU mensal
                </Label>
              </div>

              {inclIPTU && (
                <div className="space-y-1.5">
                  <Label>IPTU mensal (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register("valorIPTUMensal", { valueAsNumber: true })}
                  />
                </div>
              )}

              <Button type="submit" className="w-full">
                Calcular
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <CalcResultCard
            title="Resultado — Aluguel em Atraso"
            rows={[
              { label: "Principal", value: formatBRL(result.principal) },
              { label: "Multa contratual", value: formatBRL(result.multa) },
              { label: "Juros legais (1% a.m.)", value: formatBRL(result.juros) },
              { label: `Correção ${result.indiceAplicado}`, value: formatBRL(result.correcao) },
              ...(result.condominio > 0
                ? [{ label: "Condomínio", value: formatBRL(result.condominio) }]
                : []),
              ...(result.iptu > 0
                ? [{ label: "IPTU", value: formatBRL(result.iptu) }]
                : []),
              { label: `Total (${result.diasAtraso} dias)`, value: formatBRL(result.totalDevido), highlight: true },
            ]}
            onSave={salvar}
            saving={saving}
          />
        )}
      </div>
    </div>
  );
}

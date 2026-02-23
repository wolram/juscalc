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
import { calcularDanosMorais } from "@/lib/calc-danos-morais";
import type { DanosMoraisInput, DanosMoraisResult } from "@/lib/calc-danos-morais";
import { formatBRL } from "@/lib/formatters";

export default function DanosMoraisPage() {
  const [result, setResult] = useState<DanosMoraisResult | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<DanosMoraisInput>({
    defaultValues: {
      area: "CONSUMIDOR",
      gravidade: "MEDIA",
      capacidadeEconomicaReu: "MEDIA",
      reincidencia: false,
      rendaVitima: 0,
    },
  });

  function calcular(data: DanosMoraisInput) {
    try {
      setResult(calcularDanosMorais(data));
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
        body: JSON.stringify({
          type: "DANOS_MORAIS",
          input: form.getValues(),
          result,
        }),
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
        <h1 className="text-2xl font-bold">Danos Morais</h1>
        <p className="text-muted-foreground text-sm">
          Quantum pelo método bifásico (STJ REsp 1.152.541/RS)
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Parâmetros do Caso</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(calcular)} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Área do Direito</Label>
                <Select
                  onValueChange={(v) =>
                    form.setValue("area", v as DanosMoraisInput["area"])
                  }
                  defaultValue="CONSUMIDOR"
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONSUMIDOR">Consumidor</SelectItem>
                    <SelectItem value="ACIDENTE_TRABALHO">Acidente de Trabalho</SelectItem>
                    <SelectItem value="BANCARIO">Bancário</SelectItem>
                    <SelectItem value="MEDICO">Médico/Hospitalar</SelectItem>
                    <SelectItem value="IMAGEM_HONRA">Imagem e Honra</SelectItem>
                    <SelectItem value="FAMILIAR">Familiar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Gravidade da Ofensa</Label>
                <Select
                  onValueChange={(v) =>
                    form.setValue("gravidade", v as DanosMoraisInput["gravidade"])
                  }
                  defaultValue="MEDIA"
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LEVE">Leve</SelectItem>
                    <SelectItem value="MEDIA">Média</SelectItem>
                    <SelectItem value="GRAVE">Grave</SelectItem>
                    <SelectItem value="GRAVISSIMA">Gravíssima</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Capacidade Econômica do Réu</Label>
                <Select
                  onValueChange={(v) =>
                    form.setValue(
                      "capacidadeEconomicaReu",
                      v as DanosMoraisInput["capacidadeEconomicaReu"]
                    )
                  }
                  defaultValue="MEDIA"
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PEQUENA">Pequena</SelectItem>
                    <SelectItem value="MEDIA">Média</SelectItem>
                    <SelectItem value="GRANDE">Grande</SelectItem>
                    <SelectItem value="MUITO_GRANDE">Muito Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Renda da Vítima (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...form.register("rendaVitima", { valueAsNumber: true })}
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="reincidencia"
                  onCheckedChange={(v) => form.setValue("reincidencia", !!v)}
                />
                <Label htmlFor="reincidencia" className="font-normal cursor-pointer">
                  Réu reincidente
                </Label>
              </div>

              <Button type="submit" className="w-full">
                Calcular
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-3">
            <CalcResultCard
              title="Resultado — Danos Morais"
              rows={[
                { label: "Mínimo (faixa STJ)", value: formatBRL(result.valorMinimo) },
                { label: "Médio (referência)", value: formatBRL(result.valorMedio) },
                { label: "Máximo (faixa STJ)", value: formatBRL(result.valorMaximo) },
                { label: "Sugerido (método bifásico)", value: formatBRL(result.valorSugerido), highlight: true },
              ]}
              observations={result.precedentesSTJ}
              onSave={salvar}
              saving={saving}
            />
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {result.fundamentacao}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

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
import { calcularHonorarios } from "@/lib/calc-honorarios";
import type { HonorariosInput, HonorariosResult } from "@/lib/calc-honorarios";
import { formatBRL } from "@/lib/formatters";

export default function HonorariosPage() {
  const [result, setResult] = useState<HonorariosResult | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<HonorariosInput>({
    defaultValues: {
      tipo: "SUCUMBENCIA",
      grauJurisdicao: "PRIMEIRO",
      naturezaCausa: "MEDIA",
      beneficioEfetivo: true,
      percentualResultado: 20,
      horasTrabalhadas: 0,
      valorHora: 0,
      valorFixo: 0,
    },
  });

  const tipo = form.watch("tipo");

  function calcular(data: HonorariosInput) {
    try {
      setResult(calcularHonorarios(data));
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
          type: "HONORARIOS",
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
        <h1 className="text-2xl font-bold">Honorários Advocatícios</h1>
        <p className="text-muted-foreground text-sm">
          CPC art. 85 (sucumbência) e cálculo por resultado
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
                <Label>Tipo de Honorários</Label>
                <Select
                  onValueChange={(v) =>
                    form.setValue("tipo", v as HonorariosInput["tipo"])
                  }
                  defaultValue="SUCUMBENCIA"
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUCUMBENCIA">Sucumbência (CPC art. 85)</SelectItem>
                    <SelectItem value="RESULTADO">Êxito / Resultado</SelectItem>
                    <SelectItem value="HORA">Por Hora</SelectItem>
                    <SelectItem value="FIXO">Fixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(tipo === "SUCUMBENCIA" || tipo === "RESULTADO") && (
                <div className="space-y-1.5">
                  <Label>Valor da Causa / Condenação (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register("valorCausa", { valueAsNumber: true })}
                  />
                </div>
              )}

              {tipo === "RESULTADO" && (
                <div className="space-y-1.5">
                  <Label>Percentual de Resultado (%)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    {...form.register("percentualResultado", { valueAsNumber: true })}
                  />
                </div>
              )}

              {tipo === "HORA" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Horas trabalhadas</Label>
                    <Input
                      type="number"
                      step="0.5"
                      {...form.register("horasTrabalhadas", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Valor por hora (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...form.register("valorHora", { valueAsNumber: true })}
                    />
                  </div>
                </div>
              )}

              {tipo === "FIXO" && (
                <div className="space-y-1.5">
                  <Label>Valor fixo (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register("valorFixo", { valueAsNumber: true })}
                  />
                </div>
              )}

              {tipo === "SUCUMBENCIA" && (
                <>
                  <div className="space-y-1.5">
                    <Label>Grau de Jurisdição</Label>
                    <Select
                      onValueChange={(v) =>
                        form.setValue("grauJurisdicao", v as HonorariosInput["grauJurisdicao"])
                      }
                      defaultValue="PRIMEIRO"
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRIMEIRO">1° Grau</SelectItem>
                        <SelectItem value="SEGUNDO">2° Grau (Recursal)</SelectItem>
                        <SelectItem value="SUPERIOR">Tribunal Superior</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Natureza da Causa</Label>
                    <Select
                      onValueChange={(v) =>
                        form.setValue("naturezaCausa", v as HonorariosInput["naturezaCausa"])
                      }
                      defaultValue="MEDIA"
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SIMPLES">Simples</SelectItem>
                        <SelectItem value="MEDIA">Média</SelectItem>
                        <SelectItem value="COMPLEXA">Complexa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <Button type="submit" className="w-full">
                Calcular
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-3">
            <CalcResultCard
              title="Resultado — Honorários"
              rows={[
                ...(tipo === "SUCUMBENCIA"
                  ? [
                      { label: `Mínimo (${result.percentualMinimo.toFixed(1)}%)`, value: formatBRL(result.honorariosMinimos) },
                      { label: `Máximo (${result.percentualMaximo.toFixed(1)}%)`, value: formatBRL(result.honorariosMaximos) },
                    ]
                  : []),
                { label: "Honorários sugeridos", value: formatBRL(result.honorariosSugeridos), highlight: true },
              ]}
              observations={result.observacoes}
              onSave={salvar}
              saving={saving}
            />
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">{result.fundamentacao}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

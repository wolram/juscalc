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
import { calcularRescisao, calcularHorasExtras } from "@/lib/calc-trabalhista";
import type { RescisaoInput, RescisaoResult, HorasExtrasInput, HorasExtrasResult } from "@/lib/calc-trabalhista";
import { formatBRL } from "@/lib/formatters";

type Modulo = "rescisao" | "horas-extras" | "ferias";

export default function TrabalhistaPage() {
  const [modulo, setModulo] = useState<Modulo>("rescisao");
  const [rescisaoResult, setRescisaoResult] = useState<RescisaoResult | null>(null);
  const [horasResult, setHorasResult] = useState<HorasExtrasResult | null>(null);
  const [saving, setSaving] = useState(false);

  const rescisaoForm = useForm<RescisaoInput>({
    defaultValues: {
      tipoRescisao: "SEM_JUSTA_CAUSA",
      avisoPrevioTrabalhado: false,
      saldoFGTS: 0,
      feriasVencidas: 0,
    },
  });

  const horasForm = useForm<HorasExtrasInput>({
    defaultValues: { horasSemanais: 44 },
  });

  function calcularResc(data: RescisaoInput) {
    try {
      const result = calcularRescisao(data);
      setRescisaoResult(result);
    } catch {
      toast.error("Erro no cálculo");
    }
  }

  function calcularHoras(data: HorasExtrasInput) {
    try {
      const result = calcularHorasExtras(data);
      setHorasResult(result);
    } catch {
      toast.error("Erro no cálculo");
    }
  }

  async function salvarCalculo(type: "rescisao" | "horas") {
    setSaving(true);
    try {
      const payload = {
        type: "TRABALHISTA",
        input: type === "rescisao" ? rescisaoForm.getValues() : horasForm.getValues(),
        result: type === "rescisao" ? rescisaoResult : horasResult,
      };

      const res = await fetch("/api/calculations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();
      toast.success("Cálculo salvo no histórico");
    } catch {
      toast.error("Erro ao salvar cálculo");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Cálculos Trabalhistas</h1>
        <p className="text-muted-foreground text-sm">CLT + Súmulas TST</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["rescisao", "horas-extras", "ferias"] as Modulo[]).map((m) => (
          <Button
            key={m}
            variant={modulo === m ? "default" : "outline"}
            size="sm"
            onClick={() => setModulo(m)}
          >
            {m === "rescisao" ? "Rescisão" : m === "horas-extras" ? "Horas Extras" : "Férias"}
          </Button>
        ))}
      </div>

      {modulo === "rescisao" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Dados da Rescisão</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={rescisaoForm.handleSubmit(calcularResc)}
                className="space-y-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Salário Bruto (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...rescisaoForm.register("salarioBruto", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tipo de Rescisão</Label>
                    <Select
                      onValueChange={(v) =>
                        rescisaoForm.setValue("tipoRescisao", v as RescisaoInput["tipoRescisao"])
                      }
                      defaultValue="SEM_JUSTA_CAUSA"
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SEM_JUSTA_CAUSA">Sem Justa Causa</SelectItem>
                        <SelectItem value="COM_JUSTA_CAUSA">Com Justa Causa</SelectItem>
                        <SelectItem value="PEDIDO_DEMISSAO">Pedido de Demissão</SelectItem>
                        <SelectItem value="ACORDO_MUTUO">Acordo Mútuo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Data de Admissão</Label>
                    <Input type="date" {...rescisaoForm.register("dataAdmissao")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Data de Demissão</Label>
                    <Input type="date" {...rescisaoForm.register("dataDemissao")} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Saldo FGTS (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...rescisaoForm.register("saldoFGTS", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Férias Vencidas (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...rescisaoForm.register("feriasVencidas", { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  Calcular
                </Button>
              </form>
            </CardContent>
          </Card>

          {rescisaoResult && (
            <CalcResultCard
              title="Resultado — Rescisão"
              rows={[
                { label: "Saldo de Salário", value: formatBRL(rescisaoResult.saldoSalario) },
                { label: "Aviso Prévio", value: formatBRL(rescisaoResult.avisoPrevio) },
                { label: "Férias Vencidas", value: formatBRL(rescisaoResult.feriasVencidas) },
                { label: "Férias Proporcionais + 1/3", value: formatBRL(rescisaoResult.feriasProporcionais) },
                { label: "13° Proporcional", value: formatBRL(rescisaoResult.decimoTerceiro) },
                { label: "Multa FGTS", value: formatBRL(rescisaoResult.multaFGTS) },
                { label: "Total Bruto", value: formatBRL(rescisaoResult.totalBruto) },
                { label: "(-) INSS", value: formatBRL(rescisaoResult.inss) },
                { label: "(-) IR", value: formatBRL(rescisaoResult.ir) },
                { label: "Total Líquido", value: formatBRL(rescisaoResult.totalLiquido), highlight: true },
              ]}
              onSave={() => salvarCalculo("rescisao")}
              saving={saving}
            />
          )}
        </div>
      )}

      {modulo === "horas-extras" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Dados — Horas Extras</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={horasForm.handleSubmit(calcularHoras)}
                className="space-y-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Salário Bruto (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...horasForm.register("salarioBruto", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Horas semanais</Label>
                    <Input
                      type="number"
                      {...horasForm.register("horasSemanais", { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>HE 50% (h)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      {...horasForm.register("horasExtrasDiurnas50", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>HE 100% (h)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      {...horasForm.register("horasExtrasDiurnas100", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>HE Noturnas (h)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      {...horasForm.register("horasExtrasNoturnas", { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  Calcular
                </Button>
              </form>
            </CardContent>
          </Card>

          {horasResult && (
            <CalcResultCard
              title="Resultado — Horas Extras"
              rows={[
                { label: "Valor hora normal", value: formatBRL(horasResult.valorHoraNormal) },
                { label: "Valor HE 50%", value: formatBRL(horasResult.valorHoraExtra50) },
                { label: "Valor HE 100%", value: formatBRL(horasResult.valorHoraExtra100) },
                { label: "Valor HE noturna", value: formatBRL(horasResult.valorHoraExtraNoturna) },
                { label: "Total horas extras", value: formatBRL(horasResult.totalHorasExtras) },
                { label: "Total bruto com HE", value: formatBRL(horasResult.totalBruto), highlight: true },
              ]}
              onSave={() => salvarCalculo("horas")}
              saving={saving}
            />
          )}
        </div>
      )}

      {modulo === "ferias" && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Módulo de férias em desenvolvimento.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

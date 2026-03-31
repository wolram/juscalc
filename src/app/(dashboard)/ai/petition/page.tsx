"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Wand2, Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PeticaoContext, PeticaoTipo, AreaJuridica } from "@/lib/ai-prompts";

export default function PeticaoPage() {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const form = useForm<PeticaoContext>({
    defaultValues: {
      tipo: "INICIAL",
      area: "CIVIL",
    },
  });

  async function onSubmit(data: PeticaoContext) {
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/ai/petition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error);
      }

      const resp = (await res.json()) as { content: string };
      setResult(resp.content);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar petição");
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard() {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Gerador de Petições</h1>
        <p className="text-muted-foreground text-sm">
          Redija peças processuais com auxílio da IA
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Dados da Peça</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Tipo de Peça</Label>
                  <Select
                    onValueChange={(v) => form.setValue("tipo", v as PeticaoTipo)}
                    defaultValue="INICIAL"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INICIAL">Petição Inicial</SelectItem>
                      <SelectItem value="CONTESTACAO">Contestação</SelectItem>
                      <SelectItem value="RECURSO_APELACAO">Recurso de Apelação</SelectItem>
                      <SelectItem value="RECURSO_ESPECIAL">Recurso Especial</SelectItem>
                      <SelectItem value="EMBARGOS_DECLARACAO">Embargos de Declaração</SelectItem>
                      <SelectItem value="AGRAVO">Agravo</SelectItem>
                      <SelectItem value="MANDADO_SEGURANCA">Mandado de Segurança</SelectItem>
                      <SelectItem value="HABEAS_CORPUS">Habeas Corpus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Área do Direito</Label>
                  <Select
                    onValueChange={(v) => form.setValue("area", v as AreaJuridica)}
                    defaultValue="CIVIL"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CIVIL">Cível</SelectItem>
                      <SelectItem value="TRABALHISTA">Trabalhista</SelectItem>
                      <SelectItem value="PREVIDENCIARIO">Previdenciário</SelectItem>
                      <SelectItem value="CONSUMIDOR">Consumidor</SelectItem>
                      <SelectItem value="FAMILIA">Família</SelectItem>
                      <SelectItem value="CRIMINAL">Criminal</SelectItem>
                      <SelectItem value="TRIBUTARIO">Tributário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Fatos relevantes</Label>
                <Textarea
                  placeholder="Descreva os fatos do caso com detalhes..."
                  rows={6}
                  {...form.register("fatos", { required: true })}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Pedidos</Label>
                <Textarea
                  placeholder="Liste os pedidos que devem ser realizados..."
                  rows={4}
                  {...form.register("pedidos", { required: true })}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                <Wand2 className="h-4 w-4 mr-2" />
                {loading ? "Gerando petição..." : "Gerar Petição"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-base">Petição Gerada</CardTitle>
            {result && (
              <Button size="sm" variant="outline" onClick={copyToClipboard}>
                {copied ? (
                  <Check className="h-3.5 w-3.5 mr-1.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                )}
                {copied ? "Copiado!" : "Copiar"}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <div className="h-4 animate-pulse rounded bg-muted" />
                <div className="h-4 animate-pulse rounded bg-muted w-3/4" />
                <div className="h-4 animate-pulse rounded bg-muted" />
                <div className="h-4 animate-pulse rounded bg-muted w-5/6" />
              </div>
            ) : result ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {result}
                </pre>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Preencha os dados e clique em &quot;Gerar Petição&quot;
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

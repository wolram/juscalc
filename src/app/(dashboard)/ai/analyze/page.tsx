"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function AnalizePage() {
  const [texto, setTexto] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);

  async function analisar() {
    if (!texto.trim()) {
      toast.error("Cole o texto do documento para analisar");
      return;
    }

    setLoading(true);
    setAnalysis("");

    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textoDocumento: texto }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error);
      }

      const data = (await res.json()) as { analysis: string };
      setAnalysis(data.analysis);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro na análise");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Análise de Documento</h1>
        <p className="text-muted-foreground text-sm">
          Cole o texto do documento para extrair fatos, riscos e recomendações
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Documento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Texto do documento</Label>
              <Textarea
                placeholder="Cole aqui o texto da petição, contrato, decisão judicial ou qualquer documento jurídico..."
                rows={16}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {texto.length.toLocaleString("pt-BR")} / 50.000 caracteres
              </p>
            </div>

            <Button
              className="w-full"
              onClick={analisar}
              disabled={loading || !texto.trim()}
            >
              <Search className="h-4 w-4 mr-2" />
              {loading ? "Analisando..." : "Analisar Documento"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Análise Jurídica</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-4 animate-pulse rounded bg-muted"
                    style={{ width: `${60 + Math.random() * 40}%` }}
                  />
                ))}
              </div>
            ) : analysis ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {analysis}
                </pre>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Cole um documento e clique em "Analisar"
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

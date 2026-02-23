"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import type { ProcessType } from "@prisma/client";

interface FormData {
  cnjNumber: string;
  court: string;
  district?: string;
  judge?: string;
  type: ProcessType;
  subject: string;
  clientId: string;
}

interface Client { id: string; name: string }

export default function NewProcessPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    defaultValues: { type: "CIVIL" },
  });

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data: { data: Client[] }) => setClients(data.data ?? []))
      .catch(() => {});
  }, []);

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const res = await fetch("/api/processes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error);
      }

      const proc = (await res.json()) as { id: string };
      toast.success("Processo cadastrado");
      router.push(`/processes/${proc.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao cadastrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Novo Processo</h1>
        <p className="text-muted-foreground text-sm">Cadastrar processo judicial</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Dados do Processo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Número CNJ</Label>
              <Input
                placeholder="0000000-00.0000.0.00.0000"
                {...form.register("cnjNumber", { required: true })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tribunal</Label>
                <Input
                  placeholder="Ex: TJSP"
                  {...form.register("court", { required: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Vara / Comarca</Label>
                <Input
                  placeholder="Ex: 1ª Vara Cível de SP"
                  {...form.register("district")}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Juiz</Label>
              <Input {...form.register("judge")} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select
                  onValueChange={(v) => form.setValue("type", v as ProcessType)}
                  defaultValue="CIVIL"
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CIVIL">Cível</SelectItem>
                    <SelectItem value="CRIMINAL">Criminal</SelectItem>
                    <SelectItem value="TRABALHISTA">Trabalhista</SelectItem>
                    <SelectItem value="PREVIDENCIARIO">Previdenciário</SelectItem>
                    <SelectItem value="TRIBUTARIO">Tributário</SelectItem>
                    <SelectItem value="FAMILIA">Família</SelectItem>
                    <SelectItem value="CONSUMIDOR">Consumidor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Cliente</Label>
                <Select onValueChange={(v) => form.setValue("clientId", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar..." />
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
            </div>

            <div className="space-y-1.5">
              <Label>Assunto / Pedido principal</Label>
              <Input
                placeholder="Ex: Revisão de cláusulas contratuais"
                {...form.register("subject", { required: true })}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Cadastrando..." : "Cadastrar processo"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

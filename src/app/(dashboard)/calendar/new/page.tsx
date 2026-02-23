"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TIPOS = [
  { value: "MANIFESTATION", label: "Manifestação" },
  { value: "HEARING",       label: "Audiência" },
  { value: "APPEAL",        label: "Recurso" },
  { value: "DOCUMENT",      label: "Documento" },
  { value: "OTHER",         label: "Outro" },
] as const;

interface FormData {
  title: string;
  dueDate: string;
  type: string;
  processId?: string;
}

export default function NewCalendarEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>();

  async function onSubmit(data: FormData) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          dueDate: data.dueDate,
          type: data.type,
          processId: data.processId || undefined,
        }),
      });

      if (!res.ok) {
        const json = await res.json() as { error: string };
        throw new Error(json.error);
      }

      router.push("/calendar");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar evento");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
          <Link href="/calendar">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Novo Evento</h1>
          <p className="text-muted-foreground text-sm">Adicione um prazo ou audiência ao calendário</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados do evento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                placeholder="Ex: Audiência de conciliação, Prazo para contestação..."
                {...register("title", { required: "Título é obrigatório" })}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dueDate">Data</Label>
              <Input
                id="dueDate"
                type="date"
                {...register("dueDate", { required: "Data é obrigatória" })}
              />
              {errors.dueDate && (
                <p className="text-xs text-destructive">{errors.dueDate.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select onValueChange={(v) => setValue("type", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-xs text-destructive">Tipo é obrigatório</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="processId">
                Número do processo{" "}
                <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Input
                id="processId"
                placeholder="ID do processo (deixe vazio para evento avulso)"
                {...register("processId")}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Salvando..." : "Salvar evento"}
              </Button>
              <Button variant="outline" asChild>
                <Link href="/calendar">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

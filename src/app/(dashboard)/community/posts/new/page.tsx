"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PostType, LegalArea } from "@prisma/client";

interface FormData {
  title: string;
  content: string;
  type: PostType;
  area: LegalArea;
}

export default function NewPostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const form = useForm<FormData>({ defaultValues: { type: "ARTICLE", area: "CIVIL" } });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error);
      }

      toast.success("Post publicado na comunidade");
      router.push("/community");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao publicar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Novo Post</h1>
        <p className="text-muted-foreground text-sm">Compartilhe com a comunidade</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Conteúdo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select
                  onValueChange={(v) => form.setValue("type", v as PostType)}
                  defaultValue="ARTICLE"
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARTICLE">Artigo</SelectItem>
                    <SelectItem value="QUESTION">Dúvida</SelectItem>
                    <SelectItem value="CASE_STUDY">Case</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Área</Label>
                <Select
                  onValueChange={(v) => form.setValue("area", v as LegalArea)}
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
                    <SelectItem value="EMPRESARIAL">Empresarial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input {...form.register("title", { required: true })} />
            </div>

            <div className="space-y-1.5">
              <Label>Conteúdo</Label>
              <Textarea rows={12} {...form.register("content", { required: true })} />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Publicando..." : "Publicar"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import type { Organization, Member } from "@prisma/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Proprietário",
  ADMIN: "Admin",
  LAWYER: "Advogado",
  ASSISTANT: "Assistente",
};

const PLAN_LABELS: Record<string, string> = {
  FREE: "Gratuito",
  STARTER: "Starter",
  PRO: "Pro",
  ENTERPRISE: "Enterprise",
};

interface Props {
  organization: Organization;
  currentMember: Member;
  members: Member[];
}

export function SettingsClient({ organization, currentMember, members }: Props) {
  const [name, setName] = useState(organization.name);
  const [saving, setSaving] = useState(false);

  const canEdit = currentMember.role === "OWNER" || currentMember.role === "ADMIN";

  async function handleSaveName() {
    if (!name.trim() || name === organization.name) return;

    setSaving(true);
    try {
      const res = await fetch("/api/organizations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!res.ok) throw new Error("Erro ao salvar");
      toast.success("Nome atualizado");
    } catch {
      toast.error("Erro ao atualizar nome");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Escritório */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Escritório</CardTitle>
          <CardDescription>Informações do seu escritório</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Nome</Label>
            <div className="flex gap-2">
              <Input
                id="org-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canEdit || saving}
                className="max-w-sm"
              />
              {canEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSaveName}
                  disabled={saving || name === organization.name || !name.trim()}
                >
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Plano atual:</span>
            <Badge variant="secondary">{PLAN_LABELS[organization.plan] ?? organization.plan}</Badge>
          </div>

          <div className="text-sm text-muted-foreground">
            <span>Slug: </span>
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{organization.slug}</code>
          </div>
        </CardContent>
      </Card>

      {/* Equipe */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Equipe</CardTitle>
          <CardDescription>
            {members.length} {members.length === 1 ? "membro" : "membros"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{m.userId}</span>
                  <span className="text-xs text-muted-foreground">
                    Desde {new Date(m.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <Badge
                  variant={m.role === "OWNER" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {ROLE_LABELS[m.role] ?? m.role}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sobre o sistema */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Sobre o Sistema</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          {(
            [
              ["Sistema", "JusCalc — Plataforma Jurídica"],
              ["Versão", "2.0.0"],
              ["Fundamentação", "CDC art. 51, STJ REsp 1.061.530/RS, Res. BCB 4.855/2020"],
            ] as [string, string][]
          ).map(([label, value]) => (
            <div key={label} className="flex justify-between gap-2">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium text-right">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

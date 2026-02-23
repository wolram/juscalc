"use client";

import { useState } from "react";
import { toast } from "sonner";
import { RefreshCw, Plus, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProcessWithRelations } from "@/services/process.service";
import type { Movement, Deadline } from "@prisma/client";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  DONE: "Concluído",
  MISSED: "Perdido",
};

const DEADLINE_STATUS_ICON: Record<string, React.ElementType> = {
  PENDING: Clock,
  DONE: CheckCircle2,
  MISSED: AlertCircle,
};

interface Props {
  process: ProcessWithRelations;
}

export function ProcessDetail({ process: initialProcess }: Props) {
  const [process, setProcess] = useState(initialProcess);
  const [syncing, setSyncing] = useState(false);
  const [newMovement, setNewMovement] = useState("");
  const [addingMovement, setAddingMovement] = useState(false);
  const [newDeadline, setNewDeadline] = useState({ title: "", dueDate: "" });
  const [addingDeadline, setAddingDeadline] = useState(false);

  async function syncDataJud() {
    setSyncing(true);
    try {
      const res = await fetch(`/api/processes/${process.id}?action=datajud-sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as { synced: number };
      toast.success(`${data.synced} novo(s) andamento(s) sincronizado(s)`);

      // Recarrega dados
      const updated = await fetch(`/api/processes/${process.id}`).then(
        (r) => r.json() as Promise<typeof initialProcess>
      );
      setProcess(updated);
    } catch {
      toast.error("Erro ao sincronizar DataJud");
    } finally {
      setSyncing(false);
    }
  }

  async function addMovementSubmit() {
    if (!newMovement.trim()) return;
    setAddingMovement(true);
    try {
      const res = await fetch(`/api/processes/${process.id}?action=movement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: newMovement }),
      });
      if (!res.ok) throw new Error();
      toast.success("Andamento registrado");
      setNewMovement("");

      const updated = await fetch(`/api/processes/${process.id}`).then(
        (r) => r.json() as Promise<typeof initialProcess>
      );
      setProcess(updated);
    } catch {
      toast.error("Erro ao registrar andamento");
    } finally {
      setAddingMovement(false);
    }
  }

  async function addDeadlineSubmit() {
    if (!newDeadline.title.trim() || !newDeadline.dueDate) return;
    setAddingDeadline(true);
    try {
      const res = await fetch(`/api/processes/${process.id}?action=deadline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newDeadline.title,
          dueDate: newDeadline.dueDate,
          type: "OTHER",
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Prazo adicionado");
      setNewDeadline({ title: "", dueDate: "" });

      const updated = await fetch(`/api/processes/${process.id}`).then(
        (r) => r.json() as Promise<typeof initialProcess>
      );
      setProcess(updated);
    } catch {
      toast.error("Erro ao adicionar prazo");
    } finally {
      setAddingDeadline(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{process.subject}</h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <span className="font-mono">{process.cnjNumber}</span>
            <span>·</span>
            <span>{process.court}</span>
            {process.district && (
              <>
                <span>·</span>
                <span>{process.district}</span>
              </>
            )}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            Cliente: <span className="font-medium text-foreground">{process.client.name}</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={syncDataJud}
          disabled={syncing}
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Sincronizando..." : "Sync DataJud"}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Andamentos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Andamentos ({process.movements.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Descrever andamento..."
                value={newMovement}
                onChange={(e) => setNewMovement(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addMovementSubmit();
                }}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={addMovementSubmit}
                disabled={addingMovement || !newMovement.trim()}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {process.movements.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  Nenhum andamento registrado
                </p>
              ) : (
                process.movements.map((m: Movement) => (
                  <div key={m.id} className="flex gap-3 rounded-md bg-muted/30 p-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug">{m.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {new Date(m.date).toLocaleDateString("pt-BR")}
                        </span>
                        {m.source === "DATAJUD" && (
                          <Badge variant="outline" className="text-[10px] py-0">
                            DataJud
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Prazos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Prazos ({process.deadlines.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Prazo</Label>
                <Input
                  placeholder="Descrição..."
                  value={newDeadline.title}
                  onChange={(e) =>
                    setNewDeadline((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Data</Label>
                <div className="flex gap-1">
                  <Input
                    type="date"
                    value={newDeadline.dueDate}
                    onChange={(e) =>
                      setNewDeadline((prev) => ({ ...prev, dueDate: e.target.value }))
                    }
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addDeadlineSubmit}
                    disabled={
                      addingDeadline ||
                      !newDeadline.title.trim() ||
                      !newDeadline.dueDate
                    }
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {process.deadlines.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  Nenhum prazo cadastrado
                </p>
              ) : (
                process.deadlines.map((d: Deadline) => {
                  const StatusIcon = DEADLINE_STATUS_ICON[d.status] ?? Clock;
                  const isUrgent =
                    d.status === "PENDING" &&
                    new Date(d.dueDate) <= new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

                  return (
                    <div
                      key={d.id}
                      className={`flex items-center gap-3 rounded-md p-2.5 ${
                        isUrgent ? "bg-orange-500/10" : "bg-muted/30"
                      }`}
                    >
                      <StatusIcon
                        className={`h-4 w-4 shrink-0 ${
                          d.status === "DONE"
                            ? "text-green-500"
                            : d.status === "MISSED"
                            ? "text-red-500"
                            : isUrgent
                            ? "text-orange-500"
                            : "text-muted-foreground"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{d.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(d.dueDate).toLocaleDateString("pt-BR")} —{" "}
                          {STATUS_LABELS[d.status]}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

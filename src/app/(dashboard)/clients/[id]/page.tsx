import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getClientById } from "@/services/client.service";
import { formatBRL, formatDate, formatCPF } from "@/lib/formatters";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
          <Link href="/clients">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <p className="text-muted-foreground text-sm">{client.analyses.length} análise(s)</p>
        </div>
        <Button asChild size="sm">
          <Link href={`/analyses/new?clientId=${client.id}`}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Análise
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Dados do Cliente</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          {(
            [
              ["CPF", client.cpf ? formatCPF(client.cpf) : "—"],
              ["Telefone", client.phone ?? "—"],
              ["E-mail", client.email ?? "—"],
              ["Cadastrado em", formatDate(client.createdAt)],
            ] as [string, string][]
          ).map(([label, value]) => (
            <div key={label} className="flex justify-between gap-2">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-base font-semibold mb-3">Análises</h2>
        {client.analyses.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma análise para este cliente.</p>
        ) : (
          <div className="space-y-2">
            {client.analyses.map((analysis) => (
              <Link
                key={analysis.id}
                href={`/analyses/${analysis.id}`}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{analysis.bank}</p>
                  <p className="text-xs text-muted-foreground">
                    {analysis.contractModality} — {formatDate(analysis.contractDate)}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className="text-sm font-medium">{formatBRL(Number(analysis.releasedValue))}</span>
                  <Badge
                    variant={analysis.status === "FINALIZED" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {analysis.status === "FINALIZED" ? "Finalizado" : "Rascunho"}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

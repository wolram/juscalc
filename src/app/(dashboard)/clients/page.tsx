import { Suspense } from "react";
import Link from "next/link";
import { Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listClients } from "@/services/client.service";
import { formatCPF } from "@/lib/formatters";
import { createClient as createSupabaseClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";

async function ClientsList() {
  const supabase = await createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const member = user
    ? await prisma.member.findFirst({ where: { userId: user.id } })
    : null;

  const { data: clients, total } = await listClients(member?.organizationId ?? "", 1, 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-muted-foreground text-sm">{total} clientes cadastrados</p>
        </div>
        <Button asChild size="sm">
          <Link href="/clients/new">
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Link>
        </Button>
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum cliente cadastrado</p>
            <Button asChild size="sm" className="mt-4">
              <Link href="/clients/new">Cadastrar primeiro cliente</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border border-border overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-0 bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border">
            <span>Nome</span>
            <span>CPF</span>
            <span>Telefone</span>
            <span className="text-right">Análises</span>
          </div>
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-3 items-center hover:bg-muted/50 transition-colors border-b border-border last:border-0 text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{client.name}</p>
                <p className="text-xs text-muted-foreground truncate">{client.email ?? "—"}</p>
              </div>
              <span className="text-muted-foreground font-mono text-xs">
                {client.cpf ? formatCPF(client.cpf) : "—"}
              </span>
              <span className="text-muted-foreground">{client.phone ?? "—"}</span>
              <span className="text-right font-medium">{client.analyses.length}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground text-sm">Carregando...</div>}>
      <ClientsList />
    </Suspense>
  );
}

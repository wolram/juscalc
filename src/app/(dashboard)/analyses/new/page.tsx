import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnalysisForm } from "@/components/analyses/analysis-form";
import { listClients } from "@/services/client.service";
import { createClient as createSupabaseClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";

async function NewAnalysisContent() {
  const supabase = await createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const member = user
    ? await prisma.member.findFirst({ where: { userId: user.id } })
    : null;

  const { data: clients } = await listClients(member?.organizationId ?? "", 1, 200);

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
          <Link href="/analyses">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nova Análise</h1>
          <p className="text-muted-foreground text-sm">Preencha os dados do contrato</p>
        </div>
      </div>
      <AnalysisForm clients={clients} />
    </div>
  );
}

export default function NewAnalysisPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground text-sm">Carregando...</div>}>
      <NewAnalysisContent />
    </Suspense>
  );
}

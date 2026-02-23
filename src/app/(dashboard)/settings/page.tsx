import { Suspense } from "react";
import { createClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "@/components/settings/settings-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function SettingsContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const member = await prisma.member.findFirst({
    where: { userId: user.id },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });

  if (!member) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Nenhuma organização encontrada.{" "}
            <a href="/onboarding" className="underline text-primary">
              Criar escritório
            </a>
          </p>
        </CardContent>
      </Card>
    );
  }

  const members = await prisma.member.findMany({
    where: { organizationId: member.organizationId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <SettingsClient
      organization={member.organization}
      currentMember={member}
      members={members}
    />
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground text-sm">Escritório, equipe e plano</p>
      </div>

      <Suspense
        fallback={
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Carregando...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 animate-pulse rounded-md bg-muted" />
            </CardContent>
          </Card>
        }
      >
        <SettingsContent />
      </Suspense>
    </div>
  );
}

import { notFound } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { getProcessById } from "@/services/process.service";
import { ProcessDetail } from "@/components/processes/process-detail";
import { Card, CardContent } from "@/components/ui/card";

async function ProcessContent({ id }: { id: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const member = await prisma.member.findFirst({ where: { userId: user.id } });
  if (!member) notFound();

  const process = await getProcessById(id, member.organizationId);
  if (!process) notFound();

  return <ProcessDetail process={process} />;
}

export default async function ProcessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className="h-64 animate-pulse" />
        </Card>
      }
    >
      <ProcessContent id={id} />
    </Suspense>
  );
}

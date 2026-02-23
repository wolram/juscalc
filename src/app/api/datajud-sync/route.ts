import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { consultarProcesso, formatarMovimentos } from "@/lib/datajud-api";
import { addMovement } from "@/services/process.service";

/**
 * Cron de sincronização DataJud — processos ativos.
 * Invocado via Vercel Cron ou externamente.
 * Protegido por CRON_SECRET.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const processos = await prisma.process.findMany({
    where: { status: "ACTIVE" },
    include: {
      movements: {
        where: { source: "DATAJUD" },
        orderBy: { date: "desc" },
        take: 1,
      },
    },
    take: 50, // Processa em lotes para não sobrecarregar
  });

  const results = await Promise.allSettled(
    processos.map(async (p) => {
      const processo = await consultarProcesso(p.cnjNumber, p.court);
      if (!processo) return { id: p.id, synced: 0 };

      const movimentos = formatarMovimentos(processo);
      const ultimaData = p.movements[0]?.date ?? new Date(0);

      const novos = movimentos.filter((m) => m.date > ultimaData);
      let synced = 0;

      for (const m of novos) {
        await addMovement(p.id, m.date, m.description, "DATAJUD");
        synced++;
      }

      return { id: p.id, synced };
    })
  );

  const synced = results
    .filter((r): r is PromiseFulfilledResult<{ id: string; synced: number }> => r.status === "fulfilled")
    .reduce((s, r) => s + r.value.synced, 0);

  const errors = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({
    ok: true,
    processados: processos.length,
    movimentosSincronizados: synced,
    erros: errors,
    timestamp: new Date().toISOString(),
  });
}

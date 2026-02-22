import { prisma, Prisma } from "@/lib/prisma";
import type { CreateAnalysisInput, AnalysisWithRelations } from "@/types";

export async function createAnalysis(input: CreateAnalysisInput): Promise<AnalysisWithRelations> {
  return prisma.analysis.create({
    data: {
      contractNumber: input.contractNumber,
      bank: input.bank,
      contractModality: input.contractModality,
      vehicleModel: input.vehicleModel ?? null,
      contractDate: new Date(input.contractDate),
      releasedValue: new Prisma.Decimal(input.releasedValue),
      installments: input.installments,
      installmentValue: new Prisma.Decimal(input.installmentValue),
      contractedRate: new Prisma.Decimal(input.contractedRate),
      installmentsPaid: input.installmentsPaid,
      overdueInstallments: input.overdueInstallments,
      clientId: input.clientId,
    },
    include: {
      client: true,
      scenarios: true,
    },
  });
}

export async function getAnalysisById(id: string): Promise<AnalysisWithRelations | null> {
  return prisma.analysis.findUnique({
    where: { id },
    include: {
      client: true,
      scenarios: true,
    },
  });
}

export async function listAnalyses(
  page = 1,
  limit = 20
): Promise<{ data: AnalysisWithRelations[]; total: number }> {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.analysis.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        client: true,
        scenarios: true,
      },
    }),
    prisma.analysis.count(),
  ]);

  return { data, total };
}

export async function finalizeAnalysis(id: string): Promise<AnalysisWithRelations> {
  return prisma.analysis.update({
    where: { id },
    data: { status: "FINALIZED" },
    include: {
      client: true,
      scenarios: true,
    },
  });
}

export async function deleteAnalysis(id: string): Promise<void> {
  await prisma.analysis.delete({ where: { id } });
}

export async function getDashboardStats() {
  const [totalAnalyses, totalClients, totalFinalized] = await Promise.all([
    prisma.analysis.count(),
    prisma.client.count(),
    prisma.analysis.count({ where: { status: "FINALIZED" } }),
  ]);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const recentAnalyses = await prisma.analysis.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true, releasedValue: true },
    orderBy: { createdAt: "asc" },
  });

  const monthMap = new Map<string, { analyses: number; value: number }>();
  for (const a of recentAnalyses) {
    const key = `${a.createdAt.getFullYear()}-${String(a.createdAt.getMonth() + 1).padStart(2, "0")}`;
    const existing = monthMap.get(key) ?? { analyses: 0, value: 0 };
    monthMap.set(key, {
      analyses: existing.analyses + 1,
      value: existing.value + Number(a.releasedValue),
    });
  }

  const monthlyData = Array.from(monthMap.entries()).map(([month, data]) => ({
    month,
    ...data,
  }));

  return {
    totalAnalyses,
    totalClients,
    totalFinalized,
    totalRecoverable: 0,
    monthlyData,
  };
}

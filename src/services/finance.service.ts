import { prisma, Prisma } from "@/lib/prisma";
import type { Finance, FinanceType, FinanceStatus } from "@prisma/client";

export interface CreateFinanceInput {
  type: FinanceType;
  category: string;
  description: string;
  amount: number;
  dueDate: string;
  clientId?: string;
  processId?: string;
  organizationId: string;
}

export interface FinanceSummary {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  receitasPendentes: number;
  inadimplencia: number;
}

export async function createFinance(data: CreateFinanceInput): Promise<Finance> {
  return prisma.finance.create({
    data: {
      type: data.type,
      category: data.category,
      description: data.description,
      amount: new Prisma.Decimal(data.amount),
      dueDate: new Date(data.dueDate),
      clientId: data.clientId ?? null,
      processId: data.processId ?? null,
      organizationId: data.organizationId,
    },
  });
}

export async function listFinances(
  organizationId: string,
  opts?: { type?: FinanceType; status?: FinanceStatus; page?: number; limit?: number }
): Promise<{ data: Finance[]; total: number }> {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 30;
  const skip = (page - 1) * limit;

  const where = {
    organizationId,
    ...(opts?.type ? { type: opts.type } : {}),
    ...(opts?.status ? { status: opts.status } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.finance.findMany({
      where,
      skip,
      take: limit,
      orderBy: { dueDate: "desc" },
    }),
    prisma.finance.count({ where }),
  ]);

  return { data, total };
}

export async function getFinanceById(
  id: string,
  organizationId: string
): Promise<Finance | null> {
  return prisma.finance.findFirst({ where: { id, organizationId } });
}

export async function markAsPaid(id: string): Promise<Finance> {
  return prisma.finance.update({
    where: { id },
    data: { status: "PAID", paidAt: new Date() },
  });
}

export async function getSummary(organizationId: string): Promise<FinanceSummary> {
  const agora = new Date();
  const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const fim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);

  const [receitas, despesas, receitasPendentes, inadimplentes] = await Promise.all([
    prisma.finance.aggregate({
      where: { organizationId, type: "INCOME", status: "PAID", paidAt: { gte: inicio, lte: fim } },
      _sum: { amount: true },
    }),
    prisma.finance.aggregate({
      where: { organizationId, type: "EXPENSE", status: "PAID", paidAt: { gte: inicio, lte: fim } },
      _sum: { amount: true },
    }),
    prisma.finance.aggregate({
      where: { organizationId, type: "INCOME", status: "PENDING" },
      _sum: { amount: true },
    }),
    prisma.finance.aggregate({
      where: { organizationId, type: "INCOME", status: "OVERDUE" },
      _sum: { amount: true },
    }),
  ]);

  const totalReceitas = Number(receitas._sum.amount ?? 0);
  const totalDespesas = Number(despesas._sum.amount ?? 0);

  return {
    totalReceitas,
    totalDespesas,
    saldo: totalReceitas - totalDespesas,
    receitasPendentes: Number(receitasPendentes._sum.amount ?? 0),
    inadimplencia: Number(inadimplentes._sum.amount ?? 0),
  };
}

export async function getMonthlyData(
  organizationId: string,
  months = 12
): Promise<Array<{ month: string; receitas: number; despesas: number }>> {
  const inicio = new Date();
  inicio.setMonth(inicio.getMonth() - (months - 1));
  inicio.setDate(1);

  const finances = await prisma.finance.findMany({
    where: {
      organizationId,
      status: "PAID",
      paidAt: { gte: inicio },
    },
    select: { type: true, amount: true, paidAt: true },
    orderBy: { paidAt: "asc" },
  });

  const map = new Map<string, { receitas: number; despesas: number }>();

  for (const f of finances) {
    if (!f.paidAt) continue;
    const key = `${f.paidAt.getFullYear()}-${String(f.paidAt.getMonth() + 1).padStart(2, "0")}`;
    const existing = map.get(key) ?? { receitas: 0, despesas: 0 };

    if (f.type === "INCOME") {
      existing.receitas += Number(f.amount);
    } else {
      existing.despesas += Number(f.amount);
    }

    map.set(key, existing);
  }

  return Array.from(map.entries()).map(([month, data]) => ({ month, ...data }));
}

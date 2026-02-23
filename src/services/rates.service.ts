import { prisma, Prisma } from "@/lib/prisma";
import type { BcbRate } from "@/types";

export async function getRateForMonth(month: number, year: number): Promise<BcbRate | null> {
  return prisma.bcbRate.findFirst({
    where: { month, year, isFixed: false },
    orderBy: { createdAt: "desc" },
  });
}

export async function listRates(limit = 24): Promise<BcbRate[]> {
  return prisma.bcbRate.findMany({
    take: limit,
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
}

export async function upsertRate(
  month: number,
  year: number,
  rate: number,
  isFixed = false
): Promise<BcbRate> {
  return prisma.bcbRate.upsert({
    where: { month_year_isFixed: { month, year, isFixed } },
    create: {
      month,
      year,
      rate: new Prisma.Decimal(rate),
      isFixed,
      source: isFixed ? "MANUAL" : "BCB-SGS",
    },
    update: {
      rate: new Prisma.Decimal(rate),
    },
  });
}

export async function deleteRate(id: string): Promise<void> {
  await prisma.bcbRate.delete({ where: { id } });
}

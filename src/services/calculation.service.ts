import { prisma, Prisma } from "@/lib/prisma";
import type { Calculation, CalcType } from "@prisma/client";

export interface SaveCalculationInput {
  type: CalcType;
  input: Prisma.InputJsonValue;
  result: Prisma.InputJsonValue;
  organizationId: string;
  clientId?: string;
  processId?: string;
}

export async function saveCalculation(data: SaveCalculationInput): Promise<Calculation> {
  return prisma.calculation.create({
    data: {
      type: data.type,
      input: data.input,
      result: data.result,
      organizationId: data.organizationId,
      clientId: data.clientId ?? null,
      processId: data.processId ?? null,
    },
  });
}

export async function listCalculations(
  organizationId: string,
  type?: CalcType,
  limit = 20
): Promise<Calculation[]> {
  return prisma.calculation.findMany({
    where: {
      organizationId,
      ...(type ? { type } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getCalculationById(
  id: string,
  organizationId: string
): Promise<Calculation | null> {
  return prisma.calculation.findFirst({
    where: { id, organizationId },
  });
}

export async function deleteCalculation(id: string): Promise<void> {
  await prisma.calculation.delete({ where: { id } });
}

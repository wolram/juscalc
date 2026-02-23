import { prisma } from "@/lib/prisma";
import type { CreateClientInput, UpdateClientInput, ClientWithAnalyses } from "@/types";

export async function createClient(
  input: CreateClientInput,
  organizationId: string
): Promise<ClientWithAnalyses> {
  return prisma.client.create({
    data: { ...input, organizationId },
    include: { analyses: true },
  });
}

export async function getClientById(id: string): Promise<ClientWithAnalyses | null> {
  return prisma.client.findUnique({
    where: { id },
    include: {
      analyses: {
        include: { scenarios: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function listClients(
  organizationId: string,
  page = 1,
  limit = 20
): Promise<{ data: ClientWithAnalyses[]; total: number }> {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.client.findMany({
      where: { organizationId },
      skip,
      take: limit,
      orderBy: { name: "asc" },
      include: { analyses: true },
    }),
    prisma.client.count({ where: { organizationId } }),
  ]);

  return { data, total };
}

export async function updateClient(id: string, input: UpdateClientInput): Promise<ClientWithAnalyses> {
  return prisma.client.update({
    where: { id },
    data: input,
    include: { analyses: true },
  });
}

export async function deleteClient(id: string): Promise<void> {
  await prisma.client.delete({ where: { id } });
}

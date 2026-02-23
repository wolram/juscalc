import { prisma } from "@/lib/prisma";
import type { Process, Movement, Deadline, ProcessType, ProcessStatus } from "@prisma/client";

export type ProcessWithRelations = Process & {
  client: { id: string; name: string };
  movements: Movement[];
  deadlines: Deadline[];
  _count: { documents: number };
};

export type DeadlineWithProcess = Deadline & {
  process: { id: string; cnjNumber: string; subject: string } | null;
};

export interface CreateProcessInput {
  cnjNumber: string;
  court: string;
  district?: string;
  judge?: string;
  type: ProcessType;
  subject: string;
  clientId: string;
  organizationId: string;
}

export async function createProcess(data: CreateProcessInput): Promise<Process> {
  return prisma.process.create({ data });
}

export async function getProcessById(
  id: string,
  organizationId: string
): Promise<ProcessWithRelations | null> {
  return prisma.process.findFirst({
    where: { id, organizationId },
    include: {
      client: { select: { id: true, name: true } },
      movements: { orderBy: { date: "desc" } },
      deadlines: { orderBy: { dueDate: "asc" } },
      _count: { select: { documents: true } },
    },
  }) as Promise<ProcessWithRelations | null>;
}

export async function listProcesses(
  organizationId: string,
  opts?: { status?: ProcessStatus; clientId?: string; page?: number; limit?: number }
): Promise<{ data: ProcessWithRelations[]; total: number }> {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const skip = (page - 1) * limit;

  const where = {
    organizationId,
    ...(opts?.status ? { status: opts.status } : {}),
    ...(opts?.clientId ? { clientId: opts.clientId } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.process.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: "desc" },
      include: {
        client: { select: { id: true, name: true } },
        movements: { orderBy: { date: "desc" }, take: 1 },
        deadlines: {
          where: { status: "PENDING", dueDate: { gte: new Date() } },
          orderBy: { dueDate: "asc" },
          take: 1,
        },
        _count: { select: { documents: true } },
      },
    }),
    prisma.process.count({ where }),
  ]);

  return { data: data as ProcessWithRelations[], total };
}

export async function updateProcessStatus(
  id: string,
  status: ProcessStatus
): Promise<Process> {
  return prisma.process.update({ where: { id }, data: { status } });
}

export async function addMovement(
  processId: string,
  date: Date,
  description: string,
  source: "MANUAL" | "DATAJUD" = "MANUAL"
): Promise<Movement> {
  return prisma.movement.create({
    data: { processId, date, description, source },
  });
}

export async function addDeadline(data: {
  organizationId: string;
  processId?: string;
  title: string;
  dueDate: Date;
  type: Deadline["type"];
}): Promise<Deadline> {
  return prisma.deadline.create({ data });
}

export async function completeDeadline(id: string): Promise<Deadline> {
  return prisma.deadline.update({ where: { id }, data: { status: "DONE" } });
}

export async function getUpcomingDeadlines(
  organizationId: string,
  days = 30
): Promise<DeadlineWithProcess[]> {
  const futuro = new Date();
  futuro.setDate(futuro.getDate() + days);

  return prisma.deadline.findMany({
    where: {
      organizationId,
      status: "PENDING",
      dueDate: { lte: futuro },
    },
    include: {
      process: { select: { id: true, cnjNumber: true, subject: true } },
    },
    orderBy: { dueDate: "asc" },
  }) as Promise<DeadlineWithProcess[]>;
}

export async function listAllDeadlines(
  organizationId: string
): Promise<DeadlineWithProcess[]> {
  return prisma.deadline.findMany({
    where: { organizationId },
    include: {
      process: { select: { id: true, cnjNumber: true, subject: true } },
    },
    orderBy: { dueDate: "asc" },
  }) as Promise<DeadlineWithProcess[]>;
}

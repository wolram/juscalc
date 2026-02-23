import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { createProcess, listProcesses } from "@/services/process.service";
import type { ProcessType, ProcessStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { organizationId } = await getAuthContext();
    const { searchParams } = new URL(request.url);

    const result = await listProcesses(organizationId, {
      status: (searchParams.get("status") as ProcessStatus) ?? undefined,
      clientId: searchParams.get("clientId") ?? undefined,
      page: Number(searchParams.get("page") ?? 1),
      limit: Number(searchParams.get("limit") ?? 20),
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const { organizationId } = await getAuthContext();
    const body = (await request.json()) as {
      cnjNumber: string;
      court: string;
      district?: string;
      judge?: string;
      type: ProcessType;
      subject: string;
      clientId: string;
    };

    if (!body.cnjNumber || !body.court || !body.type || !body.clientId) {
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
    }

    const process = await createProcess({ ...body, organizationId });
    return NextResponse.json(process, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

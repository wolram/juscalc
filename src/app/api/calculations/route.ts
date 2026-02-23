import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { saveCalculation, listCalculations } from "@/services/calculation.service";
import { Prisma } from "@/lib/prisma";
import type { CalcType } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { organizationId } = await getAuthContext();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as CalcType | null;

    const calculations = await listCalculations(organizationId, type ?? undefined);
    return NextResponse.json(calculations);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const { organizationId } = await getAuthContext();
    const body = (await request.json()) as {
      type: CalcType;
      input: Prisma.InputJsonValue;
      result: Prisma.InputJsonValue;
      clientId?: string;
      processId?: string;
    };

    if (!body.type || !body.input || !body.result) {
      return NextResponse.json({ error: "type, input e result são obrigatórios" }, { status: 400 });
    }

    const calc = await saveCalculation({ ...body, organizationId });
    return NextResponse.json(calc, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

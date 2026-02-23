import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { createFinance, listFinances, getSummary } from "@/services/finance.service";
import type { FinanceType, FinanceStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { organizationId } = await getAuthContext();
    const { searchParams } = new URL(request.url);

    if (searchParams.get("summary") === "true") {
      const summary = await getSummary(organizationId);
      return NextResponse.json(summary);
    }

    const result = await listFinances(organizationId, {
      type: (searchParams.get("type") as FinanceType) ?? undefined,
      status: (searchParams.get("status") as FinanceStatus) ?? undefined,
      page: Number(searchParams.get("page") ?? 1),
      limit: Number(searchParams.get("limit") ?? 30),
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
      type: FinanceType;
      category: string;
      description: string;
      amount: number;
      dueDate: string;
      clientId?: string;
      processId?: string;
    };

    if (!body.type || !body.description || !body.amount || !body.dueDate) {
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
    }

    const finance = await createFinance({ ...body, organizationId });
    return NextResponse.json(finance, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { getFinanceById, markAsPaid } from "@/services/finance.service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await getAuthContext();
    const { id } = await params;
    const finance = await getFinanceById(id, organizationId);

    if (!finance) {
      return NextResponse.json({ error: "Lançamento não encontrado" }, { status: 404 });
    }

    return NextResponse.json(finance);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await getAuthContext();
    const { id } = await params;
    const body = (await request.json()) as { action: string };

    const finance = await getFinanceById(id, organizationId);
    if (!finance) {
      return NextResponse.json({ error: "Lançamento não encontrado" }, { status: 404 });
    }

    if (body.action === "pay") {
      const updated = await markAsPaid(id);
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

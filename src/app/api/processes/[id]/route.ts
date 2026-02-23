import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import {
  getProcessById,
  addMovement,
  addDeadline,
} from "@/services/process.service";
import { consultarProcesso, formatarMovimentos } from "@/lib/datajud-api";
import type { DeadlineType } from "@prisma/client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await getAuthContext();
    const { id } = await params;
    const process = await getProcessById(id, organizationId);

    if (!process) {
      return NextResponse.json({ error: "Processo não encontrado" }, { status: 404 });
    }

    return NextResponse.json(process);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await getAuthContext();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    const process = await getProcessById(id, organizationId);
    if (!process) {
      return NextResponse.json({ error: "Processo não encontrado" }, { status: 404 });
    }

    if (action === "movement") {
      const body = (await request.json()) as { description: string; date?: string };
      const movement = await addMovement(
        id,
        body.date ? new Date(body.date) : new Date(),
        body.description
      );
      return NextResponse.json(movement, { status: 201 });
    }

    if (action === "deadline") {
      const body = (await request.json()) as {
        title: string;
        dueDate: string;
        type: DeadlineType;
      };
      const deadline = await addDeadline({
        organizationId,
        processId: id,
        title: body.title,
        dueDate: new Date(body.dueDate),
        type: body.type,
      });
      return NextResponse.json(deadline, { status: 201 });
    }

    if (action === "datajud-sync") {
      const processo = await consultarProcesso(process.cnjNumber, process.court);

      if (!processo) {
        return NextResponse.json({ message: "Processo não encontrado no DataJud" });
      }

      const movimentos = formatarMovimentos(processo);
      const created: import("@prisma/client").Movement[] = [];

      for (const m of movimentos) {
        const existing = process.movements.find(
          (mv: import("@prisma/client").Movement) => mv.description === m.description && mv.source === "DATAJUD"
        );
        if (!existing) {
          const mov = await addMovement(id, m.date, m.description, "DATAJUD");
          created.push(mov);
        }
      }

      return NextResponse.json({ synced: created.length, movements: created });
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

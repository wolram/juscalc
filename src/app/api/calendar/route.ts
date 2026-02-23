import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { addDeadline, listAllDeadlines, completeDeadline } from "@/services/process.service";
import type { DeadlineType } from "@prisma/client";

export async function GET() {
  try {
    const { organizationId } = await getAuthContext();
    const deadlines = await listAllDeadlines(organizationId);
    return NextResponse.json(deadlines);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const { organizationId } = await getAuthContext();
    const body = (await request.json()) as {
      title: string;
      dueDate: string;
      type: DeadlineType;
      processId?: string;
      action?: "complete";
      id?: string;
    };

    if (body.action === "complete" && body.id) {
      const deadline = await completeDeadline(body.id);
      return NextResponse.json(deadline);
    }

    if (!body.title || !body.dueDate || !body.type) {
      return NextResponse.json(
        { error: "title, dueDate e type são obrigatórios" },
        { status: 400 }
      );
    }

    const deadline = await addDeadline({
      organizationId,
      processId: body.processId || undefined,
      title: body.title,
      dueDate: new Date(body.dueDate),
      type: body.type,
    });

    return NextResponse.json(deadline, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { createTemplate, listTemplates, incrementDownload } from "@/services/community.service";
import type { LegalArea } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await listTemplates({
      area: (searchParams.get("area") as LegalArea) ?? undefined,
      page: Number(searchParams.get("page") ?? 1),
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await getAuthContext();
    const body = (await request.json()) as {
      action?: "download";
      templateId?: string;
      title?: string;
      description?: string;
      content?: string;
      type?: string;
      area?: LegalArea;
    };

    if (body.action === "download" && body.templateId) {
      const template = await incrementDownload(body.templateId);
      return NextResponse.json(template);
    }

    if (!body.title || !body.content || !body.type || !body.area) {
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
    }

    const template = await createTemplate({
      title: body.title,
      description: body.description ?? "",
      content: body.content,
      type: body.type,
      area: body.area,
      authorId: userId,
    });

    return NextResponse.json(template, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

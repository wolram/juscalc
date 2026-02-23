import { NextRequest, NextResponse } from "next/server";
import { createAnalysis, listAnalyses } from "@/services/analysis.service";
import { getAuthContext } from "@/lib/auth";
import type { CreateAnalysisInput } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { organizationId } = await getAuthContext();
    const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
    const limit = Number(request.nextUrl.searchParams.get("limit") ?? "20");
    const result = await listAnalyses(page, limit, organizationId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { organizationId } = await getAuthContext();
    const body = (await request.json()) as Omit<CreateAnalysisInput, "organizationId">;
    const analysis = await createAnalysis({ ...body, organizationId });
    return NextResponse.json(analysis, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

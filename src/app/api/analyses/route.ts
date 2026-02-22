import { NextRequest, NextResponse } from "next/server";
import { createAnalysis, listAnalyses } from "@/services/analysis.service";
import type { CreateAnalysisInput } from "@/types";

export async function GET(request: NextRequest) {
  const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "20");
  const result = await listAnalyses(page, limit);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CreateAnalysisInput;
  const analysis = await createAnalysis(body);
  return NextResponse.json(analysis, { status: 201 });
}

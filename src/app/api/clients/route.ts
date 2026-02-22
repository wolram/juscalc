import { NextRequest, NextResponse } from "next/server";
import { createClient, listClients } from "@/services/client.service";
import type { CreateClientInput } from "@/types";

export async function GET(request: NextRequest) {
  const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "20");
  const result = await listClients(page, limit);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CreateClientInput;
  const client = await createClient(body);
  return NextResponse.json(client, { status: 201 });
}

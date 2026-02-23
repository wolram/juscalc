import { NextRequest, NextResponse } from "next/server";
import { createClient, listClients } from "@/services/client.service";
import { getAuthContext } from "@/lib/auth";
import type { CreateClientInput } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { organizationId } = await getAuthContext();
    const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
    const limit = Number(request.nextUrl.searchParams.get("limit") ?? "20");
    const result = await listClients(organizationId, page, limit);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { organizationId } = await getAuthContext();
    const body = (await request.json()) as CreateClientInput;
    const client = await createClient(body, organizationId);
    return NextResponse.json(client, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

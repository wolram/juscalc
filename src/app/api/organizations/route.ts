import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";
import {
  createOrganization,
  generateUniqueSlug,
  listMembers,
} from "@/services/organization.service";
import { getAuthContext } from "@/lib/auth";

export async function GET() {
  try {
    const { organizationId, member } = await getAuthContext();
    const members = await listMembers(organizationId);

    return NextResponse.json({
      organization: member.organization,
      members,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId();
    const body = (await request.json()) as { name: string };

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });
    }

    const slug = await generateUniqueSlug(body.name);
    const org = await createOrganization(body.name.trim(), slug, userId);

    return NextResponse.json(org, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

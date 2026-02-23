import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { addMember, removeMember, updateMemberRole } from "@/services/organization.service";
import type { MemberRole } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const { organizationId, member } = await getAuthContext();

    if (member.role !== "OWNER" && member.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = (await request.json()) as { userId: string; role?: MemberRole };

    if (!body.userId) {
      return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });
    }

    const newMember = await addMember(organizationId, body.userId, body.role ?? "LAWYER");
    return NextResponse.json(newMember, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { member: currentMember } = await getAuthContext();

    if (currentMember.role !== "OWNER" && currentMember.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = (await request.json()) as { memberId: string; role: MemberRole };

    if (!body.memberId || !body.role) {
      return NextResponse.json({ error: "memberId e role obrigatórios" }, { status: 400 });
    }

    const updated = await updateMemberRole(body.memberId, body.role);
    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { member: currentMember } = await getAuthContext();

    if (currentMember.role !== "OWNER" && currentMember.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json({ error: "memberId obrigatório" }, { status: 400 });
    }

    await removeMember(memberId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

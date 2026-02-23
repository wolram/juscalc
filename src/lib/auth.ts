import { createClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import type { Member, Organization } from "@prisma/client";

export interface AuthContext {
  userId: string;
  organizationId: string;
  member: Member & { organization: Organization };
}

/**
 * Extrai userId do token Supabase e resolve o organizationId ativo do usuário.
 * Lança erro se não autenticado ou sem organização associada.
 */
export async function getAuthContext(): Promise<AuthContext> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Não autenticado");
  }

  const member = await prisma.member.findFirst({
    where: { userId: user.id },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });

  if (!member) {
    throw new Error("Usuário sem organização associada");
  }

  return {
    userId: user.id,
    organizationId: member.organizationId,
    member,
  };
}

/**
 * Retorna apenas o userId autenticado. Útil para rotas que não exigem organização.
 */
export async function getAuthUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Não autenticado");
  }

  return user.id;
}

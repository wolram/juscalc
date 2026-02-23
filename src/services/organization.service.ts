import { prisma } from "@/lib/prisma";
import type { Organization, Member, MemberRole } from "@prisma/client";

export type MemberWithOrg = Member & { organization: Organization };

export async function createOrganization(
  name: string,
  slug: string,
  ownerUserId: string
): Promise<Organization> {
  return prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: { name, slug },
    });

    await tx.member.create({
      data: {
        userId: ownerUserId,
        organizationId: org.id,
        role: "OWNER",
      },
    });

    return org;
  });
}

export async function getOrganizationById(id: string): Promise<Organization | null> {
  return prisma.organization.findUnique({ where: { id } });
}

export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  return prisma.organization.findUnique({ where: { slug } });
}

export async function updateOrganization(
  id: string,
  data: Partial<Pick<Organization, "name" | "logoUrl">>
): Promise<Organization> {
  return prisma.organization.update({ where: { id }, data });
}

export async function listMembers(organizationId: string): Promise<Member[]> {
  return prisma.member.findMany({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
  });
}

export async function addMember(
  organizationId: string,
  userId: string,
  role: MemberRole = "LAWYER"
): Promise<Member> {
  return prisma.member.create({
    data: { organizationId, userId, role },
  });
}

export async function updateMemberRole(
  memberId: string,
  role: MemberRole
): Promise<Member> {
  return prisma.member.update({ where: { id: memberId }, data: { role } });
}

export async function removeMember(memberId: string): Promise<void> {
  await prisma.member.delete({ where: { id: memberId } });
}

export async function getMemberByUserId(
  userId: string,
  organizationId: string
): Promise<Member | null> {
  return prisma.member.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  });
}

/**
 * Gera slug único a partir do nome, adicionando sufixo numérico se necessário.
 */
export async function generateUniqueSlug(name: string): Promise<string> {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);

  let slug = base;
  let counter = 1;

  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${base}-${counter}`;
    counter++;
  }

  return slug;
}

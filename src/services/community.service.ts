import { prisma } from "@/lib/prisma";
import type { Post, Template, PostType, LegalArea } from "@prisma/client";

export interface CreatePostInput {
  title: string;
  content: string;
  type: PostType;
  area: LegalArea;
  authorId: string;
  organizationId: string;
}

export interface CreateTemplateInput {
  title: string;
  description: string;
  content: string;
  type: string;
  area: LegalArea;
  authorId: string;
  isPublic?: boolean;
}

export async function createPost(data: CreatePostInput): Promise<Post> {
  return prisma.post.create({ data });
}

export async function listPosts(opts?: {
  area?: LegalArea;
  type?: PostType;
  page?: number;
  limit?: number;
}): Promise<{ data: Post[]; total: number }> {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const skip = (page - 1) * limit;

  const where = {
    ...(opts?.area ? { area: opts.area } : {}),
    ...(opts?.type ? { type: opts.type } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ upvotes: "desc" }, { createdAt: "desc" }],
    }),
    prisma.post.count({ where }),
  ]);

  return { data, total };
}

export async function upvotePost(postId: string): Promise<Post> {
  return prisma.post.update({
    where: { id: postId },
    data: { upvotes: { increment: 1 } },
  });
}

export async function createTemplate(data: CreateTemplateInput): Promise<Template> {
  return prisma.template.create({
    data: {
      ...data,
      isPublic: data.isPublic ?? true,
    },
  });
}

export async function listTemplates(opts?: {
  area?: LegalArea;
  page?: number;
  limit?: number;
}): Promise<{ data: Template[]; total: number }> {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const skip = (page - 1) * limit;

  const where = {
    isPublic: true,
    ...(opts?.area ? { area: opts.area } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.template.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ downloads: "desc" }, { createdAt: "desc" }],
    }),
    prisma.template.count({ where }),
  ]);

  return { data, total };
}

export async function incrementDownload(templateId: string): Promise<Template> {
  return prisma.template.update({
    where: { id: templateId },
    data: { downloads: { increment: 1 } },
  });
}

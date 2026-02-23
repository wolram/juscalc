import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { createPost, listPosts, upvotePost } from "@/services/community.service";
import type { PostType, LegalArea } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await listPosts({
      area: (searchParams.get("area") as LegalArea) ?? undefined,
      type: (searchParams.get("type") as PostType) ?? undefined,
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
    const { organizationId, userId } = await getAuthContext();
    const body = (await request.json()) as {
      title: string;
      content: string;
      type: PostType;
      area: LegalArea;
      action?: "upvote";
      postId?: string;
    };

    if (body.action === "upvote" && body.postId) {
      const post = await upvotePost(body.postId);
      return NextResponse.json(post);
    }

    if (!body.title || !body.content || !body.type || !body.area) {
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
    }

    const post = await createPost({
      title: body.title,
      content: body.content,
      type: body.type,
      area: body.area,
      authorId: userId,
      organizationId,
    });

    return NextResponse.json(post, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

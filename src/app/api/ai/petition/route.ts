import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAuthContext } from "@/lib/auth";
import { buildPeticaoPrompt, SYSTEM_PROMPT_BASE } from "@/lib/ai-prompts";
import type { PeticaoContext } from "@/lib/ai-prompts";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    await getAuthContext();
    const body = (await request.json()) as PeticaoContext;

    if (!body.tipo || !body.area || !body.fatos || !body.pedidos) {
      return NextResponse.json(
        { error: "tipo, area, fatos e pedidos são obrigatórios" },
        { status: 400 }
      );
    }

    const prompt = buildPeticaoPrompt(body);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT_BASE,
      messages: [{ role: "user", content: prompt }],
    });

    const contentBlock = message.content[0];
    const text = contentBlock?.type === "text" ? contentBlock.text : "";

    return NextResponse.json({
      content: text,
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

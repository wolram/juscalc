import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAuthContext } from "@/lib/auth";
import { buildAnaliseDocumentoPrompt, SYSTEM_PROMPT_BASE } from "@/lib/ai-prompts";
import type { AnaliseCasoContext } from "@/lib/ai-prompts";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    await getAuthContext();
    const body = (await request.json()) as AnaliseCasoContext;

    if (!body.textoDocumento?.trim()) {
      return NextResponse.json({ error: "textoDocumento obrigatório" }, { status: 400 });
    }

    if (body.textoDocumento.length > 50000) {
      return NextResponse.json(
        { error: "Documento muito extenso (máx. 50.000 caracteres)" },
        { status: 400 }
      );
    }

    const prompt = buildAnaliseDocumentoPrompt(body);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: SYSTEM_PROMPT_BASE,
      messages: [{ role: "user", content: prompt }],
    });

    const contentBlock = message.content[0];
    const text = contentBlock?.type === "text" ? contentBlock.text : "";

    return NextResponse.json({ analysis: text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Prompts jurídicos especializados para Claude API
 * Mantidos separados da lógica de chamada para facilitar iteração
 */

export type PeticaoTipo =
  | "INICIAL"
  | "CONTESTACAO"
  | "RECURSO_APELACAO"
  | "RECURSO_ESPECIAL"
  | "EMBARGOS_DECLARACAO"
  | "AGRAVO"
  | "MANDADO_SEGURANCA"
  | "HABEAS_CORPUS";

export type AreaJuridica =
  | "CIVIL"
  | "TRABALHISTA"
  | "PREVIDENCIARIO"
  | "CONSUMIDOR"
  | "FAMILIA"
  | "CRIMINAL"
  | "TRIBUTARIO";

export interface PeticaoContext {
  tipo: PeticaoTipo;
  area: AreaJuridica;
  fatos: string;
  pedidos: string;
  parteAutora?: string;
  parteRe?: string;
  processoNumero?: string;
  tribunal?: string;
}

export interface AnaliseCasoContext {
  textoDocumento: string;
  area?: AreaJuridica;
}

export interface AssistenteChatContext {
  processoNumero?: string;
  processoBreveSummary?: string;
  area?: AreaJuridica;
}

export const SYSTEM_PROMPT_BASE = `Você é um assistente jurídico especializado em direito brasileiro.
Seu objetivo é auxiliar advogados com análises jurídicas, redação de peças processuais e pesquisa de jurisprudência.

Regras fundamentais:
- Sempre cite os dispositivos legais aplicáveis (artigos de lei, súmulas, jurisprudência)
- Use linguagem jurídica formal e precisa
- Indique quando há incerteza ou quando recomenda consulta adicional
- Fundamente sempre com base no ordenamento jurídico brasileiro vigente
- Não invente números de processos, datas ou decisões
- Responda sempre em português do Brasil`;

export function buildPeticaoPrompt(ctx: PeticaoContext): string {
  const tipoLabels: Record<PeticaoTipo, string> = {
    INICIAL: "petição inicial",
    CONTESTACAO: "contestação",
    RECURSO_APELACAO: "recurso de apelação",
    RECURSO_ESPECIAL: "recurso especial",
    EMBARGOS_DECLARACAO: "embargos de declaração",
    AGRAVO: "agravo",
    MANDADO_SEGURANCA: "mandado de segurança",
    HABEAS_CORPUS: "habeas corpus",
  };

  return `Redija uma ${tipoLabels[ctx.tipo]} na área de direito ${ctx.area.toLowerCase()}.

${ctx.parteAutora ? `**Parte autora/requerente:** ${ctx.parteAutora}` : ""}
${ctx.parteRe ? `**Parte ré/requerida:** ${ctx.parteRe}` : ""}
${ctx.processoNumero ? `**Processo:** ${ctx.processoNumero}` : ""}
${ctx.tribunal ? `**Tribunal:** ${ctx.tribunal}` : ""}

**Fatos relevantes:**
${ctx.fatos}

**Pedidos:**
${ctx.pedidos}

Elabore a peça processual completa com: endereçamento, qualificação das partes, exposição dos fatos, fundamentação jurídica com citação de lei e jurisprudência relevante, e requerimentos. Use formatação adequada para peça processual.`;
}

export function buildAnaliseDocumentoPrompt(ctx: AnaliseCasoContext): string {
  return `Analise o documento jurídico a seguir e forneça:

1. **Resumo executivo** (3-5 linhas)
2. **Pontos principais** identificados
3. **Riscos jurídicos** identificados
4. **Oportunidades** ou argumentos favoráveis
5. **Recomendações** de ação
6. **Dispositivos legais** aplicáveis

${ctx.area ? `Área do direito: ${ctx.area}` : ""}

**Documento:**
${ctx.textoDocumento}`;
}

export function buildAssistenteSystemPrompt(ctx: AssistenteChatContext): string {
  let contextoProceso = "";

  if (ctx.processoNumero || ctx.processoBreveSummary) {
    contextoProceso = `\n\nCONTEXTO DO PROCESSO ATIVO:
${ctx.processoNumero ? `Número CNJ: ${ctx.processoNumero}` : ""}
${ctx.processoBreveSummary ? `Resumo: ${ctx.processoBreveSummary}` : ""}
${ctx.area ? `Área: ${ctx.area}` : ""}

Utilize este contexto para responder perguntas sobre o caso específico.`;
  }

  return SYSTEM_PROMPT_BASE + contextoProceso;
}

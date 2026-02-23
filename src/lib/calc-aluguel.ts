/**
 * Cálculos de aluguel em atraso — Lei do Inquilinato (Lei 8.245/91)
 */

export type IndiceCorrecao = "IGPM" | "IPCA" | "INPC" | "SELIC";

export interface AluguelAtrasadoInput {
  valorAluguel: number;
  dataVencimento: string;
  dataPagamento: string;
  multaContratual: number;
  indiceCorrecao: IndiceCorrecao;
  incluirCondominio: boolean;
  valorCondominio?: number;
  incluirIPTU: boolean;
  valorIPTUMensal?: number;
}

export interface AluguelAtrasadoResult {
  principal: number;
  multa: number;
  juros: number;
  correcao: number;
  condominio: number;
  iptu: number;
  totalDevido: number;
  diasAtraso: number;
  indiceAplicado: string;
}

export interface DebitoLocacaoInput {
  parcelas: Array<{
    vencimento: string;
    valorAluguel: number;
    valorCondominio?: number;
    valorIPTU?: number;
    pago: boolean;
  }>;
  dataCalculo: string;
  multaContratual: number;
  indiceCorrecao: IndiceCorrecao;
}

export interface DebitoLocacaoResult {
  parcelas: Array<{
    vencimento: string;
    principal: number;
    multa: number;
    juros: number;
    correcao: number;
    total: number;
  }>;
  totalGeral: number;
  mesesEmAtraso: number;
}

// Taxas mensais aproximadas para cálculo (valores históricos médios)
const TAXAS_MENSAIS: Record<IndiceCorrecao, number> = {
  IGPM: 0.0083,  // média histórica ~10% a.a.
  IPCA: 0.00367, // meta ~4,5% a.a.
  INPC: 0.0038,
  SELIC: 0.00887,
};

function diasEntre(inicio: Date, fim: Date): number {
  return Math.floor((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
}

export function calcularAluguelAtrasado(input: AluguelAtrasadoInput): AluguelAtrasadoResult {
  const vencimento = new Date(input.dataVencimento);
  const pagamento = new Date(input.dataPagamento);
  const dias = diasEntre(vencimento, pagamento);

  const meses = dias / 30;
  const taxa = TAXAS_MENSAIS[input.indiceCorrecao];

  // Multa contratual única (geralmente 10-20% da Lei do Inquilinato)
  const multa = input.valorAluguel * (input.multaContratual / 100);

  // Juros legais: 1% a.m. (CC art. 406)
  const juros = input.valorAluguel * 0.01 * meses;

  // Correção pelo índice escolhido
  const correcao = input.valorAluguel * taxa * meses;

  const condominio = input.incluirCondominio ? (input.valorCondominio ?? 0) : 0;
  const iptu = input.incluirIPTU ? (input.valorIPTUMensal ?? 0) : 0;

  return {
    principal: input.valorAluguel,
    multa: Math.round(multa * 100) / 100,
    juros: Math.round(juros * 100) / 100,
    correcao: Math.round(correcao * 100) / 100,
    condominio,
    iptu,
    totalDevido:
      Math.round((input.valorAluguel + multa + juros + correcao + condominio + iptu) * 100) / 100,
    diasAtraso: dias,
    indiceAplicado: input.indiceCorrecao,
  };
}

export function calcularDebitoLocacao(input: DebitoLocacaoInput): DebitoLocacaoResult {
  const dataCalculo = new Date(input.dataCalculo);
  const taxa = TAXAS_MENSAIS[input.indiceCorrecao];

  const parcelasCalculadas = input.parcelas
    .filter((p) => !p.pago)
    .map((p) => {
      const vencimento = new Date(p.vencimento);
      const dias = diasEntre(vencimento, dataCalculo);
      const meses = Math.max(0, dias / 30);
      const principal = p.valorAluguel + (p.valorCondominio ?? 0) + (p.valorIPTU ?? 0);
      const multa = p.valorAluguel * (input.multaContratual / 100);
      const juros = p.valorAluguel * 0.01 * meses;
      const correcao = p.valorAluguel * taxa * meses;

      return {
        vencimento: p.vencimento,
        principal,
        multa: Math.round(multa * 100) / 100,
        juros: Math.round(juros * 100) / 100,
        correcao: Math.round(correcao * 100) / 100,
        total: Math.round((principal + multa + juros + correcao) * 100) / 100,
      };
    });

  return {
    parcelas: parcelasCalculadas,
    totalGeral:
      Math.round(parcelasCalculadas.reduce((s, p) => s + p.total, 0) * 100) / 100,
    mesesEmAtraso: parcelasCalculadas.length,
  };
}

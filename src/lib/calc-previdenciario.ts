/**
 * Cálculos previdenciários — LBPS e IN INSS
 * Lei 8.213/1991 — Benefícios da Previdência Social
 */

// Teto do RGPS 2025
export const TETO_RGPS_2025 = 8157.41;
export const SALARIO_MINIMO_2025 = 1518.0;

export interface RMIInput {
  mediaContribuicoes: number;
  totalContribuicoesMeses: number;
  idadeAnos: number;
  sexo: "M" | "F";
  especieBeneficio: "APOSENTADORIA_TEMPO" | "APOSENTADORIA_INVALIDEZ" | "AUXILIO_DOENCA" | "PENSAO_MORTE" | "LOAS_BPC";
  dataFiliacao: string;
}

export interface RMIResult {
  coeficiente: number;
  rmi: number;
  salarioBeneficio: number;
  observacoes: string[];
}

export interface JurosMoraINSSInput {
  valorAtrasado: number;
  dataCompetencia: string;
  dataPagamento: string;
}

export interface JurosMoraINSSResult {
  juros: number;
  correcao: number;
  multa: number;
  totalDevido: number;
  mesesAtraso: number;
}

export interface DERInput {
  dataDoRequerimento: string;
  dataAfastamento?: string;
  carenciaMeses: number;
  especieBeneficio: "AUXILIO_DOENCA" | "APOSENTADORIA_INVALIDEZ";
}

export interface DERResult {
  DIB: string;
  DIBReafirmada: string | null;
  carenciaAtendida: boolean;
  observacoes: string[];
}

// ─── RMI ─────────────────────────────────────────────────────────────────────

export function calcularRMI(input: RMIInput): RMIResult {
  const observacoes: string[] = [];
  const salarioBeneficio = Math.min(input.mediaContribuicoes, TETO_RGPS_2025);

  // Regra de transição — EC 103/2019 para segurados já filiados antes de 13/11/2019
  // Fórmula atual: 60% + 2% por ano acima de 20 anos (homem) ou 15 anos (mulher)
  const anosMinimos = input.sexo === "M" ? 20 : 15;
  const anosContribuicao = input.totalContribuicoesMeses / 12;
  const anosExcedentes = Math.max(0, anosContribuicao - anosMinimos);
  const coeficiente = Math.min(1.0, 0.6 + anosExcedentes * 0.02);

  let rmi = salarioBeneficio * coeficiente;

  // Aposentadoria por invalidez: 100%
  if (input.especieBeneficio === "APOSENTADORIA_INVALIDEZ") {
    rmi = salarioBeneficio;
    observacoes.push("Aposentadoria por invalidez: coeficiente 100% do salário-de-benefício");
  }

  // Auxílio-doença: 91%
  if (input.especieBeneficio === "AUXILIO_DOENCA") {
    rmi = salarioBeneficio * 0.91;
    observacoes.push("Auxílio-doença: 91% do salário-de-benefício (art. 61 LBPS)");
  }

  // LOAS/BPC: 1 salário mínimo
  if (input.especieBeneficio === "LOAS_BPC") {
    rmi = SALARIO_MINIMO_2025;
    observacoes.push("LOAS/BPC: 1 salário mínimo (art. 203, V, CF/88 + Lei 8.742/93)");
  }

  // Mínimo = salário mínimo
  if (rmi < SALARIO_MINIMO_2025) {
    rmi = SALARIO_MINIMO_2025;
    observacoes.push("RMI ajustada ao salário mínimo (piso constitucional)");
  }

  return {
    coeficiente: Math.round(coeficiente * 10000) / 10000,
    rmi: Math.round(rmi * 100) / 100,
    salarioBeneficio: Math.round(salarioBeneficio * 100) / 100,
    observacoes,
  };
}

// ─── Juros de mora INSS ───────────────────────────────────────────────────────

export function calcularJurosMoraINSS(input: JurosMoraINSSInput): JurosMoraINSSResult {
  const competencia = new Date(input.dataCompetencia);
  const pagamento = new Date(input.dataPagamento);

  const meses =
    (pagamento.getFullYear() - competencia.getFullYear()) * 12 +
    (pagamento.getMonth() - competencia.getMonth());

  // Multa mora: 0,5% ao mês, max 20% (Lei 8.212/91 art. 35)
  const percentualMulta = Math.min(meses * 0.005, 0.2);
  const multa = input.valorAtrasado * percentualMulta;

  // Juros simples SELIC acumulado (simplificado: SELIC média ~ 10,65% a.a. = 0,887% a.m.)
  const taxaMensalSelic = 0.00887;
  const juros = input.valorAtrasado * taxaMensalSelic * meses;

  // Correção IPCA simplificada (~4,5% a.a. = 0,367% a.m.)
  const taxaMensalIPCA = 0.00367;
  const correcao = input.valorAtrasado * taxaMensalIPCA * meses;

  const totalDevido = input.valorAtrasado + juros + correcao + multa;

  return {
    juros: Math.round(juros * 100) / 100,
    correcao: Math.round(correcao * 100) / 100,
    multa: Math.round(multa * 100) / 100,
    totalDevido: Math.round(totalDevido * 100) / 100,
    mesesAtraso: meses,
  };
}

// ─── DIB e reafirmação ────────────────────────────────────────────────────────

export function calcularDIB(input: DERInput): DERResult {
  const DER = new Date(input.dataDoRequerimento);
  const observacoes: string[] = [];

  // DIB = DER para maioria dos benefícios
  const DIB = DER.toISOString().split("T")[0] ?? input.dataDoRequerimento;

  // Reafirmação de DER: quando há afastamento anterior ao DER
  let DIBReafirmada: string | null = null;
  if (input.dataAfastamento) {
    const afastamento = new Date(input.dataAfastamento);
    if (afastamento < DER) {
      DIBReafirmada = afastamento.toISOString().split("T")[0] ?? null;
      observacoes.push(
        "Possível reafirmação da DIB para a data do afastamento (Súmula 22 TNU)"
      );
    }
  }

  // Verificar carência
  const carenciaAtendida = input.carenciaMeses >= 12;
  if (!carenciaAtendida) {
    observacoes.push(
      `Carência insuficiente: ${input.carenciaMeses} meses (mínimo 12 para auxílio-doença)`
    );
  }

  return {
    DIB,
    DIBReafirmada,
    carenciaAtendida,
    observacoes,
  };
}

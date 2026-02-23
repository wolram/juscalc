/**
 * Cálculos trabalhistas — CLT e TST
 * Base: salário mínimo 2025 = R$ 1.518,00 (Lei 14.663/2023, atualizado)
 */

export const SALARIO_MINIMO_2025 = 1518.0;
export const SALARIO_MINIMO_2024 = 1412.0;

// Tabela INSS 2025 (progressiva — IN RFB 2.116/2022 + atualizações)
const FAIXAS_INSS_2025 = [
  { limite: 1518.0, aliquota: 0.075 },
  { limite: 2793.88, aliquota: 0.09 },
  { limite: 4190.83, aliquota: 0.12 },
  { limite: 8157.41, aliquota: 0.14 },
];

export interface RescisaoInput {
  salarioBruto: number;
  dataAdmissao: string;
  dataDemissao: string;
  tipoRescisao: "SEM_JUSTA_CAUSA" | "COM_JUSTA_CAUSA" | "PEDIDO_DEMISSAO" | "ACORDO_MUTUO";
  avisoPrevioTrabalhado: boolean;
  saldoFGTS: number;
  feriasVencidas: number;
  feriasProporcionais12: boolean;
}

export interface RescisaoResult {
  avisoPrevio: number;
  saldoSalario: number;
  ferias13: number;
  feriasProporcionais: number;
  feriasVencidas: number;
  decimoTerceiro: number;
  multaFGTS: number;
  totalBruto: number;
  inss: number;
  ir: number;
  totalLiquido: number;
  detalhes: Record<string, number>;
}

export interface HorasExtrasInput {
  salarioBruto: number;
  horasSemanais: number;
  horasExtrasDiurnas50: number;
  horasExtrasDiurnas100: number;
  horasExtrasNoturnas: number;
}

export interface HorasExtrasResult {
  valorHoraNormal: number;
  valorHoraExtra50: number;
  valorHoraExtra100: number;
  valorHoraExtraNoturna: number;
  totalHorasExtras: number;
  totalBruto: number;
}

export interface FeriasInput {
  salarioBruto: number;
  diasTrabalhados: number;
  diasFaltaInjustificada: number;
}

export interface FeriasResult {
  diasDireito: number;
  valorFerias: number;
  tercoConstitucional: number;
  totalBruto: number;
  inss: number;
  ir: number;
  totalLiquido: number;
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

function calcularINSS(salario: number): number {
  let base = salario;
  let inss = 0;
  let anterior = 0;

  for (const faixa of FAIXAS_INSS_2025) {
    if (base <= 0) break;
    const faixaBase = Math.min(base, faixa.limite - anterior);
    inss += faixaBase * faixa.aliquota;
    base -= faixaBase;
    anterior = faixa.limite;
  }

  return Math.round(inss * 100) / 100;
}

function calcularIR(baseCalculo: number): number {
  // Tabela IRRF 2025
  if (baseCalculo <= 2259.20) return 0;
  if (baseCalculo <= 2826.65) return baseCalculo * 0.075 - 169.44;
  if (baseCalculo <= 3751.05) return baseCalculo * 0.15 - 381.44;
  if (baseCalculo <= 4664.68) return baseCalculo * 0.225 - 662.77;
  return baseCalculo * 0.275 - 896.00;
}

function mesesEntre(inicio: Date, fim: Date): number {
  return (fim.getFullYear() - inicio.getFullYear()) * 12 + (fim.getMonth() - inicio.getMonth());
}

function diasEntre(inicio: Date, fim: Date): number {
  return Math.floor((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Rescisão ─────────────────────────────────────────────────────────────────

export function calcularRescisao(input: RescisaoInput): RescisaoResult {
  const admissao = new Date(input.dataAdmissao);
  const demissao = new Date(input.dataDemissao);
  const mesesTrabalhados = mesesEntre(admissao, demissao);
  const diasRestantes = demissao.getDate();

  // Saldo de salário (dias do mês de demissão)
  const diasNoMes = new Date(demissao.getFullYear(), demissao.getMonth() + 1, 0).getDate();
  const saldoSalario = (input.salarioBruto / diasNoMes) * diasRestantes;

  // Aviso prévio (CLT art. 487 + Súmula 441 TST: 3 dias por ano, max 90)
  const anosCompletos = Math.floor(mesesTrabalhados / 12);
  const diasAvisoPrevio = Math.min(30 + anosCompletos * 3, 90);
  const avisoPrevio =
    input.tipoRescisao === "SEM_JUSTA_CAUSA" && !input.avisoPrevioTrabalhado
      ? (input.salarioBruto / 30) * diasAvisoPrevio
      : 0;

  // Férias proporcionais
  const mesesAquisitivos = mesesTrabalhados % 12;
  const feriasProporcionais = (input.salarioBruto / 12) * mesesAquisitivos;
  const tercoFeriasProporcionais = feriasProporcionais / 3;

  // 13° proporcional
  const decimoTerceiro = (input.salarioBruto / 12) * mesesAquisitivos;

  // 13° de férias vencidas
  const ferias13 = input.feriasVencidas > 0 ? input.salarioBruto / 3 : 0;

  // Multa FGTS 40% (apenas sem justa causa e acordo mútuo)
  const multaFGTS =
    input.tipoRescisao === "SEM_JUSTA_CAUSA"
      ? input.saldoFGTS * 0.4
      : input.tipoRescisao === "ACORDO_MUTUO"
      ? input.saldoFGTS * 0.2
      : 0;

  const totalBruto =
    saldoSalario +
    avisoPrevio +
    input.feriasVencidas +
    ferias13 +
    feriasProporcionais +
    tercoFeriasProporcionais +
    decimoTerceiro +
    multaFGTS;

  const baseINSS =
    saldoSalario + avisoPrevio + feriasProporcionais + decimoTerceiro;
  const inss = calcularINSS(baseINSS);
  const baseIR = baseINSS - inss;
  const ir = Math.max(0, calcularIR(baseIR));

  return {
    avisoPrevio: Math.round(avisoPrevio * 100) / 100,
    saldoSalario: Math.round(saldoSalario * 100) / 100,
    ferias13: Math.round(ferias13 * 100) / 100,
    feriasProporcionais: Math.round((feriasProporcionais + tercoFeriasProporcionais) * 100) / 100,
    feriasVencidas: Math.round(input.feriasVencidas * 100) / 100,
    decimoTerceiro: Math.round(decimoTerceiro * 100) / 100,
    multaFGTS: Math.round(multaFGTS * 100) / 100,
    totalBruto: Math.round(totalBruto * 100) / 100,
    inss: Math.round(inss * 100) / 100,
    ir: Math.round(ir * 100) / 100,
    totalLiquido: Math.round((totalBruto - inss - ir) * 100) / 100,
    detalhes: {
      diasAvisoPrevio,
      mesesTrabalhados,
      mesesAquisitivos,
    },
  };
}

// ─── Horas extras ─────────────────────────────────────────────────────────────

export function calcularHorasExtras(input: HorasExtrasInput): HorasExtrasResult {
  const valorHoraNormal = input.salarioBruto / (input.horasSemanais * 4.33);
  const valorHoraExtra50 = valorHoraNormal * 1.5;
  const valorHoraExtra100 = valorHoraNormal * 2;
  const valorHoraExtraNoturna = valorHoraNormal * 1.7; // adicional noturno 20% + 50% hora extra

  const totalHorasExtras =
    input.horasExtrasDiurnas50 * valorHoraExtra50 +
    input.horasExtrasDiurnas100 * valorHoraExtra100 +
    input.horasExtrasNoturnas * valorHoraExtraNoturna;

  return {
    valorHoraNormal: Math.round(valorHoraNormal * 100) / 100,
    valorHoraExtra50: Math.round(valorHoraExtra50 * 100) / 100,
    valorHoraExtra100: Math.round(valorHoraExtra100 * 100) / 100,
    valorHoraExtraNoturna: Math.round(valorHoraExtraNoturna * 100) / 100,
    totalHorasExtras: Math.round(totalHorasExtras * 100) / 100,
    totalBruto: Math.round((input.salarioBruto + totalHorasExtras) * 100) / 100,
  };
}

// ─── Férias ───────────────────────────────────────────────────────────────────

export function calcularFerias(input: FeriasInput): FeriasResult {
  // CLT art. 130 — direito proporcional a faltas injustificadas
  let diasDireito = 30;
  if (input.diasFaltaInjustificada >= 5 && input.diasFaltaInjustificada <= 14)
    diasDireito = 24;
  else if (input.diasFaltaInjustificada >= 15 && input.diasFaltaInjustificada <= 23)
    diasDireito = 18;
  else if (input.diasFaltaInjustificada >= 24 && input.diasFaltaInjustificada <= 32)
    diasDireito = 12;
  else if (input.diasFaltaInjustificada > 32) diasDireito = 0;

  const valorFerias = (input.salarioBruto / 30) * diasDireito;
  const tercoConstitucional = valorFerias / 3;
  const totalBruto = valorFerias + tercoConstitucional;

  const inss = calcularINSS(totalBruto);
  const ir = Math.max(0, calcularIR(totalBruto - inss));

  return {
    diasDireito,
    valorFerias: Math.round(valorFerias * 100) / 100,
    tercoConstitucional: Math.round(tercoConstitucional * 100) / 100,
    totalBruto: Math.round(totalBruto * 100) / 100,
    inss: Math.round(inss * 100) / 100,
    ir: Math.round(ir * 100) / 100,
    totalLiquido: Math.round((totalBruto - inss - ir) * 100) / 100,
  };
}

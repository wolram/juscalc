/**
 * Cálculo de honorários advocatícios
 * CPC art. 85 (sucumbência) + tabelas OAB
 */

export type TipoHonorarios = "SUCUMBENCIA" | "RESULTADO" | "HORA" | "FIXO";

export interface HonorariosInput {
  tipo: TipoHonorarios;
  valorCausa: number;
  percentualResultado?: number;
  horasTrabalhadas?: number;
  valorHora?: number;
  valorFixo?: number;
  grauJurisdicao: "PRIMEIRO" | "SEGUNDO" | "SUPERIOR";
  naturezaCausa: "SIMPLES" | "MEDIA" | "COMPLEXA";
  beneficioEfetivo: boolean;
}

export interface HonorariosResult {
  honorariosMinimos: number;
  honorariosMaximos: number;
  honorariosSugeridos: number;
  percentualMinimo: number;
  percentualMaximo: number;
  fundamentacao: string;
  observacoes: string[];
}

// Faixas do CPC art. 85 (percentuais sobre o valor da condenação)
// §2°: 10%-20% para causas até 200 SM; §3°: faixas progressivas para causas maiores
const SALARIO_MINIMO = 1518.0;
const FAIXAS_ART85 = [
  { limite: 200 * SALARIO_MINIMO, min: 0.1, max: 0.2 },
  { limite: 2000 * SALARIO_MINIMO, min: 0.08, max: 0.1 },
  { limite: 20000 * SALARIO_MINIMO, min: 0.05, max: 0.08 },
  { limite: 100000 * SALARIO_MINIMO, min: 0.03, max: 0.05 },
  { limite: Infinity, min: 0.01, max: 0.03 },
];

function calcularSucumbencia(valorCausa: number): {
  min: number;
  max: number;
  sugerido: number;
  pctMin: number;
  pctMax: number;
} {
  let valorRestante = valorCausa;
  let honorariosMin = 0;
  let honorariosMax = 0;
  let anterior = 0;

  for (const faixa of FAIXAS_ART85) {
    if (valorRestante <= 0) break;
    const base = Math.min(valorRestante, faixa.limite - anterior);
    honorariosMin += base * faixa.min;
    honorariosMax += base * faixa.max;
    valorRestante -= base;
    anterior = faixa.limite;
  }

  const pctMin = (honorariosMin / valorCausa) * 100;
  const pctMax = (honorariosMax / valorCausa) * 100;

  return {
    min: Math.round(honorariosMin * 100) / 100,
    max: Math.round(honorariosMax * 100) / 100,
    sugerido: Math.round(((honorariosMin + honorariosMax) / 2) * 100) / 100,
    pctMin: Math.round(pctMin * 100) / 100,
    pctMax: Math.round(pctMax * 100) / 100,
  };
}

export function calcularHonorarios(input: HonorariosInput): HonorariosResult {
  const observacoes: string[] = [];

  if (input.tipo === "SUCUMBENCIA") {
    const { min, max, sugerido, pctMin, pctMax } = calcularSucumbencia(input.valorCausa);

    // Causa complexa: tende ao teto
    const sugeridoAjustado =
      input.naturezaCausa === "COMPLEXA"
        ? max * 0.9
        : input.naturezaCausa === "SIMPLES"
        ? min * 1.2
        : sugerido;

    // Segundo e superior grau: possibilidade de majoração
    if (input.grauJurisdicao !== "PRIMEIRO") {
      observacoes.push(
        "Grau de jurisdição superior: possível majoração dos honorários recursais (CPC art. 85, §11)"
      );
    }

    return {
      honorariosMinimos: min,
      honorariosMaximos: max,
      honorariosSugeridos: Math.round(sugeridoAjustado * 100) / 100,
      percentualMinimo: pctMin,
      percentualMaximo: pctMax,
      fundamentacao: `CPC art. 85, §2° e §3° — honorários sucumbenciais calculados sobre o valor da causa (R$ ${input.valorCausa.toLocaleString("pt-BR", { minimumFractionDigits: 2 })})`,
      observacoes,
    };
  }

  if (input.tipo === "RESULTADO") {
    const pct = input.percentualResultado ?? 20;
    const valor = input.valorCausa * (pct / 100);

    observacoes.push(`${pct}% sobre o benefício obtido — contrato de risco`);
    if (pct > 30)
      observacoes.push("Percentual acima de 30%: verificar tabela OAB estadual");

    return {
      honorariosMinimos: input.valorCausa * 0.1,
      honorariosMaximos: input.valorCausa * 0.3,
      honorariosSugeridos: Math.round(valor * 100) / 100,
      percentualMinimo: 10,
      percentualMaximo: 30,
      fundamentacao: `Honorários de êxito: ${pct}% sobre o resultado obtido`,
      observacoes,
    };
  }

  if (input.tipo === "HORA") {
    const valor = (input.horasTrabalhadas ?? 0) * (input.valorHora ?? 0);
    return {
      honorariosMinimos: valor * 0.8,
      honorariosMaximos: valor * 1.2,
      honorariosSugeridos: Math.round(valor * 100) / 100,
      percentualMinimo: 0,
      percentualMaximo: 0,
      fundamentacao: `${input.horasTrabalhadas ?? 0}h × R$ ${(input.valorHora ?? 0).toFixed(2)}/h`,
      observacoes,
    };
  }

  // FIXO
  return {
    honorariosMinimos: input.valorFixo ?? 0,
    honorariosMaximos: input.valorFixo ?? 0,
    honorariosSugeridos: input.valorFixo ?? 0,
    percentualMinimo: 0,
    percentualMaximo: 0,
    fundamentacao: "Honorários fixos contratados",
    observacoes,
  };
}

/**
 * Cálculo de danos morais — critérios STJ por área
 * Método bifásico STJ (REsp 1.152.541/RS)
 */

export type AreaDireitoDM =
  | "CONSUMIDOR"
  | "ACIDENTE_TRABALHO"
  | "BANCARIO"
  | "MEDICO"
  | "IMAGEM_HONRA"
  | "FAMILIAR";

export type GravidadeOfensa = "LEVE" | "MEDIA" | "GRAVE" | "GRAVISSIMA";

export interface DanosMoraisInput {
  area: AreaDireitoDM;
  gravidade: GravidadeOfensa;
  rendaVitima: number;
  capacidadeEconomicaReu: "PEQUENA" | "MEDIA" | "GRANDE" | "MUITO_GRANDE";
  reincidencia: boolean;
  duracaoDanoMeses?: number;
}

export interface DanosMoraisResult {
  valorMinimo: number;
  valorMedio: number;
  valorMaximo: number;
  valorSugerido: number;
  fatorGravidade: number;
  fatorCapacidade: number;
  precedentesSTJ: string[];
  fundamentacao: string;
}

// Tabela de parâmetros por área (valores atualizados 2024/2025)
const PARAMETROS_AREA: Record<
  AreaDireitoDM,
  { min: number; medio: number; max: number; precedentes: string[] }
> = {
  CONSUMIDOR: {
    min: 1000,
    medio: 5000,
    max: 15000,
    precedentes: [
      "REsp 1.722.705/RS — inscrição indevida SPC/Serasa",
      "REsp 1.630.101/DF — cobrança abusiva",
      "AgInt no AREsp 1.476.765/SP — falha na prestação de serviço",
    ],
  },
  ACIDENTE_TRABALHO: {
    min: 10000,
    medio: 50000,
    max: 200000,
    precedentes: [
      "REsp 1.767.348/SP — acidente com sequelas permanentes",
      "REsp 1.549.976/SP — doença ocupacional",
    ],
  },
  BANCARIO: {
    min: 2000,
    medio: 10000,
    max: 30000,
    precedentes: [
      "REsp 1.631.842/GO — negativação indevida",
      "REsp 1.721.065/BA — fraude em conta",
    ],
  },
  MEDICO: {
    min: 20000,
    medio: 100000,
    max: 500000,
    precedentes: [
      "REsp 1.803.091/SP — erro médico com sequelas",
      "REsp 1.540.580/DF — infecção hospitalar",
    ],
  },
  IMAGEM_HONRA: {
    min: 5000,
    medio: 20000,
    max: 100000,
    precedentes: [
      "REsp 1.767.492/SP — publicação ofensiva",
      "REsp 1.695.380/SP — acusação falsa",
    ],
  },
  FAMILIAR: {
    min: 20000,
    medio: 80000,
    max: 300000,
    precedentes: [
      "REsp 1.642.997/RS — morte de familiar",
      "REsp 1.544.053/MG — abandono afetivo",
    ],
  },
};

const FATOR_GRAVIDADE: Record<GravidadeOfensa, number> = {
  LEVE: 0.5,
  MEDIA: 1.0,
  GRAVE: 1.5,
  GRAVISSIMA: 2.5,
};

const FATOR_CAPACIDADE: Record<string, number> = {
  PEQUENA: 0.7,
  MEDIA: 1.0,
  GRANDE: 1.5,
  MUITO_GRANDE: 2.0,
};

export function calcularDanosMorais(input: DanosMoraisInput): DanosMoraisResult {
  const params = PARAMETROS_AREA[input.area];
  const fatorGravidade = FATOR_GRAVIDADE[input.gravidade];
  const fatorCapacidade = FATOR_CAPACIDADE[input.capacidadeEconomicaReu] ?? 1.0;

  // Método bifásico STJ:
  // 1ª fase: fixação do valor base pelo interesse jurídico lesado
  // 2ª fase: ajuste pelas circunstâncias do caso
  const valorBase = params.medio * fatorGravidade;
  const ajuste = fatorCapacidade * (input.reincidencia ? 1.5 : 1.0);
  const valorSugerido = valorBase * ajuste;

  const fundamentacao =
    `Cálculo pelo método bifásico (STJ REsp 1.152.541/RS). ` +
    `Área: ${input.area.replace(/_/g, " ")}. ` +
    `Gravidade: ${input.gravidade}. ` +
    `Capacidade econômica do réu: ${input.capacidadeEconomicaReu.replace(/_/g, " ")}. ` +
    (input.reincidencia ? "Reincidência do ofensor considerada. " : "") +
    (input.duracaoDanoMeses
      ? `Duração dos danos: ${input.duracaoDanoMeses} meses. `
      : "");

  return {
    valorMinimo: params.min,
    valorMedio: params.medio,
    valorMaximo: params.max,
    valorSugerido: Math.round(valorSugerido / 100) * 100,
    fatorGravidade,
    fatorCapacidade,
    precedentesSTJ: params.precedentes,
    fundamentacao,
  };
}

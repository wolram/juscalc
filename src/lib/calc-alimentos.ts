/**
 * Cálculos de alimentos — CC e CPC
 * Art. 1.694 a 1.710 do Código Civil
 */

export const SALARIO_MINIMO_2025 = 1518.0;

export interface AlimentosInput {
  rendaLiquidaAlimentante: number;
  percentualSalarioMinimo?: number;
  percentualRenda?: number;
  tipoCalculo: "PERCENTUAL_SM" | "PERCENTUAL_RENDA" | "VALOR_FIXO";
  valorFixo?: number;
  numeroBeneficiarios: number;
}

export interface AlimentosResult {
  valorMensal: number;
  valorPorBeneficiario: number;
  percentualEfetivo: number;
  observacoes: string[];
}

export interface AcumulacaoAlimentosInput {
  valorMensalFixado: number;
  dataUltimoPagamento: string;
  dataCalculo: string;
  incluirJuros: boolean;
  incluirCorrecao: boolean;
}

export interface AcumulacaoAlimentosResult {
  parcelas: Array<{
    competencia: string;
    valorOriginal: number;
    correcao: number;
    juros: number;
    total: number;
  }>;
  totalPrincipal: number;
  totalCorrecao: number;
  totalJuros: number;
  totalGeral: number;
}

// ─── Cálculo de quantum ───────────────────────────────────────────────────────

export function calcularAlimentos(input: AlimentosInput): AlimentosResult {
  const observacoes: string[] = [];
  let valorMensal = 0;

  switch (input.tipoCalculo) {
    case "PERCENTUAL_SM": {
      const pct = input.percentualSalarioMinimo ?? 0;
      valorMensal = SALARIO_MINIMO_2025 * (pct / 100);
      observacoes.push(
        `${pct}% do salário mínimo (R$ ${SALARIO_MINIMO_2025.toFixed(2)})`
      );
      break;
    }
    case "PERCENTUAL_RENDA": {
      const pct = input.percentualRenda ?? 0;
      valorMensal = input.rendaLiquidaAlimentante * (pct / 100);
      observacoes.push(`${pct}% da renda líquida declarada`);
      break;
    }
    case "VALOR_FIXO": {
      valorMensal = input.valorFixo ?? 0;
      observacoes.push("Valor fixo definido pelo juízo");
      break;
    }
  }

  const percentualEfetivo =
    input.rendaLiquidaAlimentante > 0
      ? (valorMensal / input.rendaLiquidaAlimentante) * 100
      : 0;

  if (percentualEfetivo > 30) {
    observacoes.push(
      "Atenção: percentual acima de 30% pode ser questionado quanto à possibilidade do alimentante"
    );
  }

  return {
    valorMensal: Math.round(valorMensal * 100) / 100,
    valorPorBeneficiario:
      Math.round((valorMensal / input.numeroBeneficiarios) * 100) / 100,
    percentualEfetivo: Math.round(percentualEfetivo * 100) / 100,
    observacoes,
  };
}

// ─── Acumulação de parcelas ───────────────────────────────────────────────────

export function calcularAcumulacaoAlimentos(
  input: AcumulacaoAlimentosInput
): AcumulacaoAlimentosResult {
  const inicio = new Date(input.dataUltimoPagamento);
  inicio.setMonth(inicio.getMonth() + 1);
  const fim = new Date(input.dataCalculo);

  const parcelas: AcumulacaoAlimentosResult["parcelas"] = [];
  const cursor = new Date(inicio);

  // IPCA mensal aproximado
  const ipca = 0.00367;
  // Juros legais 1% a.m. (CC art. 406 c/c CTN art. 161)
  const jurosLegais = 0.01;

  while (cursor <= fim) {
    const mesesAtraso = Math.max(
      0,
      (fim.getFullYear() - cursor.getFullYear()) * 12 +
        (fim.getMonth() - cursor.getMonth())
    );

    const correcao = input.incluirCorrecao
      ? input.valorMensalFixado * ipca * mesesAtraso
      : 0;
    const juros = input.incluirJuros
      ? input.valorMensalFixado * jurosLegais * mesesAtraso
      : 0;

    parcelas.push({
      competencia: cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
      valorOriginal: input.valorMensalFixado,
      correcao: Math.round(correcao * 100) / 100,
      juros: Math.round(juros * 100) / 100,
      total: Math.round((input.valorMensalFixado + correcao + juros) * 100) / 100,
    });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  const totalPrincipal = parcelas.reduce((s, p) => s + p.valorOriginal, 0);
  const totalCorrecao = parcelas.reduce((s, p) => s + p.correcao, 0);
  const totalJuros = parcelas.reduce((s, p) => s + p.juros, 0);

  return {
    parcelas,
    totalPrincipal: Math.round(totalPrincipal * 100) / 100,
    totalCorrecao: Math.round(totalCorrecao * 100) / 100,
    totalJuros: Math.round(totalJuros * 100) / 100,
    totalGeral: Math.round((totalPrincipal + totalCorrecao + totalJuros) * 100) / 100,
  };
}

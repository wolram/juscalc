export interface PriceTableParams {
  principal: number;
  rate: number;
  installments: number;
}

export interface PriceTableResult {
  installment: number;
  totalDue: number;
}

export interface ContractInput {
  releasedValue: number;
  installments: number;
  installmentValue: number;
  contractedRate: number;
  installmentsPaid: number;
}

export interface ScenarioResult {
  type: "BCB_AVERAGE" | "FIXED_148" | "BCB_150" | "CUSTOM";
  label: string;
  rate: number;
  installment: number;
  totalDue: number;
  totalPaid: number;
  overpaid: number;
  savings: number;
  reductionPct: number;
  monthlyDiff: number;
  isAbusive: boolean;
}

export type DiagnosticLevel = "NORMAL" | "ABOVE" | "ABUSIVE";

export interface DiagnosticResult {
  level: DiagnosticLevel;
  label: string;
  color: "green" | "yellow" | "red";
  description: string;
}

// Fórmula Tabela Price: PMT = PV * [i*(1+i)^n] / [(1+i)^n - 1]
export function calculatePriceTable({ principal, rate, installments }: PriceTableParams): PriceTableResult {
  if (rate === 0) {
    const installment = principal / installments;
    return { installment, totalDue: installment * installments };
  }

  const factor = Math.pow(1 + rate, installments);
  const installment = principal * (rate * factor) / (factor - 1);
  const totalDue = installment * installments;

  return {
    installment: Math.round(installment * 100) / 100,
    totalDue: Math.round(totalDue * 100) / 100,
  };
}

// Calcula saldo devedor estimado (Tabela Price) após N parcelas pagas
export function calculateRemainingBalance(input: ContractInput): number {
  const rate = input.contractedRate / 100;
  const rows = buildAmortizationTable({
    principal: input.releasedValue,
    rate,
    installments: input.installments,
  });

  const paid = Math.min(input.installmentsPaid, rows.length);
  if (paid === 0) return input.releasedValue;
  return rows[paid - 1]?.balance ?? 0;
}

// Valor total já pago
export function calculateTotalPaid(installmentValue: number, installmentsPaid: number): number {
  return Math.round(installmentValue * installmentsPaid * 100) / 100;
}

// STJ REsp 1.061.530/RS: abusivo se taxa > 150% da média BCB
export function isAbusive(contractedRate: number, bcbRate: number): boolean {
  return contractedRate > bcbRate * 1.5;
}

// Diagnóstico automático
export function getDiagnostic(contractedRate: number, bcbRate: number): DiagnosticResult {
  if (contractedRate <= bcbRate) {
    return {
      level: "NORMAL",
      label: "Dentro do padrão médio de mercado",
      color: "green",
      description:
        "A taxa contratada está dentro da média de mercado divulgada pelo Banco Central do Brasil.",
    };
  }

  if (contractedRate <= bcbRate * 1.5) {
    return {
      level: "ABOVE",
      label: "Encargos acima do padrão médio de mercado",
      color: "yellow",
      description:
        "A taxa contratada supera a média de mercado BACEN, porém não atinge o limite de abusividade fixado pelo STJ (1,5× a média).",
    };
  }

  return {
    level: "ABUSIVE",
    label: "Muito acima do padrão médio de mercado",
    color: "red",
    description:
      "A taxa contratada é superior a 1,5 vezes a taxa média de mercado divulgada pelo BACEN, caracterizando abusividade nos termos do STJ (REsp 1.061.530/RS).",
  };
}

export function calculateScenario(
  input: ContractInput,
  scenarioRate: number,
  bcbRate: number,
  type: "BCB_AVERAGE" | "FIXED_148" | "BCB_150" | "CUSTOM",
  label: string
): ScenarioResult {
  const rateDecimal = scenarioRate / 100;
  const { installment, totalDue } = calculatePriceTable({
    principal: input.releasedValue,
    rate: rateDecimal,
    installments: input.installments,
  });

  const totalPaid = input.installmentValue * input.installmentsPaid;
  const totalPaidAtScenario = installment * input.installmentsPaid;
  const overpaid = totalPaid - totalPaidAtScenario;
  const savings = (input.installmentValue - installment) * (input.installments - input.installmentsPaid);
  const monthlyDiff = input.installmentValue - installment;
  const reductionPct =
    input.installmentValue > 0
      ? ((input.installmentValue - installment) / input.installmentValue) * 100
      : 0;

  return {
    type,
    label,
    rate: scenarioRate,
    installment: Math.round(installment * 100) / 100,
    totalDue: Math.round(totalDue * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    overpaid: Math.round(overpaid * 100) / 100,
    savings: Math.round(savings * 100) / 100,
    monthlyDiff: Math.round(monthlyDiff * 100) / 100,
    reductionPct: Math.round(reductionPct * 100) / 100,
    isAbusive: isAbusive(scenarioRate, bcbRate),
  };
}

// Gera os 3 cenários fixos do laudo
export function calculateScenarios(input: ContractInput, bcbRate: number): ScenarioResult[] {
  return [
    calculateScenario(input, bcbRate, bcbRate, "BCB_AVERAGE", "Parâmetro BACEN"),
    calculateScenario(input, 1.48, bcbRate, "FIXED_148", "Taxa Fixa 1,48% a.m."),
    calculateScenario(input, bcbRate * 1.5, bcbRate, "BCB_150", "Limite STJ (1,5× BACEN)"),
  ];
}

// Conclusão automática para o laudo
export function generateConclusion(
  input: ContractInput,
  bcbRate: number,
  scenarios: ScenarioResult[]
): string {
  const diagnostic = getDiagnostic(input.contractedRate, bcbRate);
  const bcbScenario = scenarios.find((s) => s.type === "BCB_AVERAGE");
  const reductionPct = bcbScenario ? bcbScenario.reductionPct.toFixed(2) : "0";
  const monthlyDiff = bcbScenario ? bcbScenario.monthlyDiff.toFixed(2) : "0";
  const savings = bcbScenario ? bcbScenario.savings.toFixed(2) : "0";

  if (diagnostic.level === "NORMAL") {
    return `A análise comparativa das condições do financiamento em questão demonstra que a taxa de juros contratada (${input.contractedRate.toFixed(2)}% a.m.) está dentro do parâmetro médio de mercado divulgado pelo Banco Central do Brasil para o período (${bcbRate.toFixed(2)}% a.m.), não sendo identificada, neste cenário, a caracterização de cláusula abusiva nos moldes do art. 51 do Código de Defesa do Consumidor e da jurisprudência consolidada do Superior Tribunal de Justiça (REsp 1.061.530/RS). Recomenda-se análise mais aprofundada da documentação contratual completa para avaliação de eventuais outras irregularidades.`;
  }

  const abusiveNote =
    diagnostic.level === "ABUSIVE"
      ? ` A taxa praticada supera o limite de 1,5 vezes a média BACEN, configurando abusividade flagrante nos termos do STJ (REsp 1.061.530/RS) e da Resolução BCB n. 4.855/2020, fundamentando ação revisional com elevado grau de êxito.`
      : "";

  return `A análise técnica comparativa das condições contratuais indica que a taxa de juros contratada (${input.contractedRate.toFixed(2)}% a.m.) é superior à taxa média de mercado divulgada pelo Banco Central do Brasil para o período da contratação (${bcbRate.toFixed(2)}% a.m.), evidenciando a viabilidade de ação revisional para adequação dos encargos.${abusiveNote}

Com base no parâmetro BACEN, estima-se uma redução mensal de R$ ${monthlyDiff} por parcela (${reductionPct}% de redução), representando uma economia total estimada de R$ ${savings} até o término do contrato. O montante já desembolsado a maior, considerando as parcelas já pagas, encontra-se detalhado nos cenários da seção anterior.

Fundamentos jurídicos aplicáveis: art. 51, incisos IV e XV, do Código de Defesa do Consumidor; REsp 1.061.530/RS (Recurso Repetitivo — STJ); Resolução BCB n. 4.855/2020 (transparência nas operações de crédito).`;
}

export interface AmortizationRow {
  installmentNumber: number;
  installmentValue: number;
  interest: number;
  amortization: number;
  balance: number;
}

export function buildAmortizationTable(params: PriceTableParams): AmortizationRow[] {
  const { principal, rate, installments } = params;
  const { installment } = calculatePriceTable(params);
  const rows: AmortizationRow[] = [];
  let balance = principal;

  for (let i = 1; i <= installments; i++) {
    const interest = balance * rate;
    const amortization = installment - interest;
    balance = balance - amortization;

    rows.push({
      installmentNumber: i,
      installmentValue: Math.round(installment * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      amortization: Math.round(amortization * 100) / 100,
      balance: Math.max(0, Math.round(balance * 100) / 100),
    });
  }

  return rows;
}

export function extractImpliedRate(
  principal: number,
  installmentValue: number,
  installments: number
): number {
  let low = 0;
  let high = 10;
  let mid = 0;

  for (let iter = 0; iter < 100; iter++) {
    mid = (low + high) / 2;
    const { installment } = calculatePriceTable({ principal, rate: mid / 100, installments });
    if (Math.abs(installment - installmentValue) < 0.001) break;
    if (installment < installmentValue) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return Math.round(mid * 10000) / 10000;
}

import type { AnalysisWithRelations, SerializedAnalysis } from "@/types";

export function serializeAnalysis(a: AnalysisWithRelations): SerializedAnalysis {
  return {
    ...a,
    contractDate: a.contractDate.toISOString(),
    releasedValue: Number(a.releasedValue),
    installmentValue: Number(a.installmentValue),
    contractedRate: Number(a.contractedRate),
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    client: {
      ...a.client,
      createdAt: a.client.createdAt.toISOString(),
      updatedAt: a.client.updatedAt.toISOString(),
    },
    scenarios: a.scenarios.map((s) => ({
      ...s,
      rate: Number(s.rate),
      monthlyInstallment: Number(s.monthlyInstallment),
      totalDue: Number(s.totalDue),
      totalPaid: Number(s.totalPaid),
      overpaid: Number(s.overpaid),
      savings: Number(s.savings),
      reductionPct: Number(s.reductionPct),
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
  };
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatPercent(value: number, decimals = 2): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR").format(d);
}

export function formatMonthYear(month: number, year: number): string {
  return new Date(year, month - 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

export function parseBRL(value: string): number {
  return parseFloat(value.replace(/\./g, "").replace(",", "."));
}

export function formatCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, "");
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
}

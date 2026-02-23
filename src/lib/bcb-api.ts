export interface BcbRateEntry {
  month: number;
  year: number;
  rate: number;
  source: string;
}

// SGS série 20714: Crédito pessoal não consignado — % a.a.
// https://api.bcb.gov.br/dados/serie/bcdata.sgs.20714/dados
const SGS_BASE_URL = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.20714/dados";

function annualToMonthly(rateAnnual: number): number {
  // Equivalência composta: r_m = (1 + r_a)^(1/12) - 1
  const monthly = (Math.pow(1 + rateAnnual / 100, 1 / 12) - 1) * 100;
  return Math.round(monthly * 10000) / 10000;
}

export async function fetchBcbRateForMonth(
  month: number,
  year: number
): Promise<BcbRateEntry | null> {
  const mm = String(month).padStart(2, "0");
  const lastDay = new Date(year, month, 0).getDate();
  const startDate = `01/${mm}/${year}`;
  const endDate = `${lastDay}/${mm}/${year}`;

  const url = `${SGS_BASE_URL}?formato=json&dataInicial=${startDate}&dataFinal=${endDate}`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as Array<{ data: string; valor: string }>;

    if (!data || data.length === 0) return null;

    const record = data[0];
    if (!record) return null;

    const rateAnnual = parseFloat(record.valor);
    if (isNaN(rateAnnual)) return null;

    return {
      month,
      year,
      rate: annualToMonthly(rateAnnual),
      source: "BCB-SGS",
    };
  } catch {
    return null;
  }
}

export async function fetchBcbRatesRange(
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number
): Promise<BcbRateEntry[]> {
  const results: BcbRateEntry[] = [];

  let year = startYear;
  let month = startMonth;

  while (year < endYear || (year === endYear && month <= endMonth)) {
    const entry = await fetchBcbRateForMonth(month, year);
    if (entry) results.push(entry);

    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  return results;
}

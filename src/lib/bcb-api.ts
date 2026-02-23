export interface BcbRateEntry {
  month: number;
  year: number;
  rate: number;
  source: string;
}

interface BcbApiRecord {
  Mes: string;
  Taxa: string;
  Modalidade?: string;
}

interface BcbApiResponse {
  value: BcbApiRecord[];
}

const BCB_OSTAT_BASE_URL =
  "https://olinda.bcb.gov.br/olinda/servico/OSTAT_Meses/versao/v1/odata/TaxasCredito";

export async function fetchBcbRateForMonth(
  month: number,
  year: number
): Promise<BcbRateEntry | null> {
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  const url = `${BCB_OSTAT_BASE_URL}?$format=json&$filter=Mes eq '${monthStr}'&$top=10`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as BcbApiResponse;

    if (!data.value || data.value.length === 0) return null;

    // Busca a modalidade de crédito pessoal não consignado (referência de mercado)
    const record =
      data.value.find((r) =>
        r.Modalidade?.toLowerCase().includes("pessoal")
      ) ?? data.value[0];

    if (!record) return null;

    const rate = parseFloat(record.Taxa ?? "0");

    return {
      month,
      year,
      rate,
      source: "BCB-OSTAT",
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

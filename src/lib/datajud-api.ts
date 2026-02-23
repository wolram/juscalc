/**
 * Integração com API pública DataJud (CNJ)
 * https://datajud-wiki.cnj.jus.br/api-publica/
 */

export interface DataJudMovimento {
  codigo: number;
  nome: string;
  dataHora: string;
  complementosTabelados?: Array<{ codigo: number; nome: string }>;
}

export interface DataJudProcesso {
  id: string;
  numeroProcesso: string;
  classeProcessual?: { codigo: number; nome: string };
  orgaoJulgador?: { codigo: number; nome: string; codigoMunicipioIBGE?: number };
  dataAjuizamento?: string;
  movimentos?: DataJudMovimento[];
  assuntos?: Array<{ codigo: number; nome: string }>;
  partes?: Array<{
    nome: string;
    tipo: string;
    advogados?: Array<{ nome: string; codigoAdvogado: string }>;
  }>;
}

// Mapa de siglas de tribunais para identificadores DataJud
const TRIBUNAL_MAP: Record<string, string> = {
  TJSP: "tjsp",
  TJRJ: "tjrj",
  TJMG: "tjmg",
  TJRS: "tjrs",
  TJPR: "tjpr",
  TJSC: "tjsc",
  TJBA: "tjba",
  TJGO: "tjgo",
  TJPE: "tjpe",
  TJCE: "tjce",
  TJAM: "tjam",
  TJPA: "tjpa",
  TJMA: "tjma",
  TJMS: "tjms",
  TJMT: "tjmt",
  TJES: "tjes",
  TJRN: "tjrn",
  TJPB: "tjpb",
  TJPI: "tjpi",
  TJAL: "tjal",
  TJSE: "tjse",
  TJAC: "tjac",
  TJAP: "tjap",
  TJRR: "tjrr",
  TJRO: "tjro",
  TJTO: "tjto",
  TRT1: "trt1",
  TRT2: "trt2",
  TRT3: "trt3",
  TRT4: "trt4",
  TRT15: "trt15",
  STJ: "stj",
  TST: "tst",
};

export function getTribunalId(sigla: string): string | null {
  return TRIBUNAL_MAP[sigla.toUpperCase()] ?? null;
}

export async function consultarProcesso(
  cnjNumber: string,
  tribunalSigla: string
): Promise<DataJudProcesso | null> {
  const tribunalId = getTribunalId(tribunalSigla);

  if (!tribunalId) {
    throw new Error(`Tribunal não suportado: ${tribunalSigla}`);
  }

  // Remove formatação do número CNJ
  const numeroLimpo = cnjNumber.replace(/\D/g, "");

  const url = `https://api-publica.datajud.cnj.jus.br/api_publica_${tribunalId}/_search`;

  const body = {
    query: {
      match: {
        numeroProcesso: numeroLimpo,
      },
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "ApiKey cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==",
    },
    body: JSON.stringify(body),
    next: { revalidate: 3600 }, // Cache 1h
  });

  if (!res.ok) {
    throw new Error(`DataJud retornou ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as {
    hits?: { hits?: Array<{ _source: DataJudProcesso }> };
  };

  const hit = data.hits?.hits?.[0]?._source;
  return hit ?? null;
}

export function formatarMovimentos(processo: DataJudProcesso): Array<{
  date: Date;
  description: string;
  source: string;
}> {
  return (processo.movimentos ?? []).map((m) => ({
    date: new Date(m.dataHora),
    description: m.nome,
    source: "DATAJUD",
  }));
}

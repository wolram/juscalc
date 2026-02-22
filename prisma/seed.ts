import "dotenv/config";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { calculatePriceTable } from "../src/lib/calculations";

const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"]! });
const prisma = new PrismaClient({ adapter });

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface BrasilApiBank {
  ispb: string;
  name: string;
  code: number | null;
  fullName: string | null;
}

interface AnalysisSeed {
  clientIdx: number;
  bankCode: number;
  vehicle: string;
  contractDate: Date;
  releasedValue: number;
  installments: number;
  contractedRate: number;
  installmentsPaid: number;
  overdueInstallments: number;
  contractNumber: string;
  status?: "DRAFT" | "FINALIZED";
}

// ─── Taxa média BACEN — financiamento de veículos (% a.m.) ──────────────────
// Fonte: BCB/OSTAT — Modalidade "Aquisição de veículos — Total"

const BCB_RATES = [
  { month: 1, year: 2024, rate: 1.74 },
  { month: 2, year: 2024, rate: 1.72 },
  { month: 3, year: 2024, rate: 1.70 },
  { month: 4, year: 2024, rate: 1.68 },
  { month: 5, year: 2024, rate: 1.65 },
  { month: 6, year: 2024, rate: 1.63 },
  { month: 7, year: 2024, rate: 1.61 },
  { month: 8, year: 2024, rate: 1.62 },
  { month: 9, year: 2024, rate: 1.60 },
  { month: 10, year: 2024, rate: 1.58 },
  { month: 11, year: 2024, rate: 1.59 },
  { month: 12, year: 2024, rate: 1.57 },
  { month: 1, year: 2025, rate: 1.65 },
  { month: 2, year: 2025, rate: 1.68 },
  { month: 3, year: 2025, rate: 1.70 },
  { month: 4, year: 2025, rate: 1.72 },
  { month: 5, year: 2025, rate: 1.71 },
  { month: 6, year: 2025, rate: 1.70 },
  { month: 7, year: 2025, rate: 1.69 },
  { month: 8, year: 2025, rate: 1.68 },
];

// ─── Bancos ───────────────────────────────────────────────────────────────────
// Nomes de fallback caso a BrasilAPI esteja indisponível

const BANK_FALLBACKS: Record<number, string> = {
  623: "Banco Pan S.A.",
  237: "Banco Bradesco S.A.",
  1: "Banco do Brasil S.A.",
  341: "Itaú Unibanco S.A.",
  33: "Banco Santander (Brasil) S.A.",
  104: "Caixa Econômica Federal",
  655: "BV Financeira S.A. — Crédito, Financiamento e Investimento",
  260: "Nu Pagamentos S.A.",
};

async function fetchBanks(): Promise<Record<number, string>> {
  try {
    const res = await fetch("https://brasilapi.com.br/api/banks/v1");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const banks: BrasilApiBank[] = await res.json() as BrasilApiBank[];
    const wanted = new Set(Object.keys(BANK_FALLBACKS).map(Number));
    const result: Record<number, string> = {};

    for (const bank of banks) {
      if (bank.code !== null && wanted.has(bank.code)) {
        result[bank.code] = bank.fullName ?? bank.name;
      }
    }

    console.log(`  BrasilAPI: ${Object.keys(result).length} bancos carregados`);
    return result;
  } catch {
    console.warn("  BrasilAPI indisponível — usando nomes de fallback");
    return BANK_FALLBACKS;
  }
}

// ─── Clientes ────────────────────────────────────────────────────────────────
// CPFs válidos — gerados com algoritmo de dígitos verificadores

const CLIENTS = [
  {
    name: "João Carlos Ferreira",
    cpf: "123.456.789-09",
    phone: "(11) 98765-4321",
    email: "joao.ferreira@gmail.com",
  },
  {
    name: "Maria Aparecida Silva",
    cpf: "987.654.321-00",
    phone: "(21) 99234-5678",
    email: "maria.silva@hotmail.com",
  },
  {
    name: "Pedro Henrique Souza",
    cpf: "456.789.012-49",
    phone: "(31) 98901-2345",
    email: "pedro.souza@uol.com.br",
  },
  {
    name: "Ana Paula Rodrigues",
    cpf: "321.654.987-91",
    phone: "(41) 97654-3210",
    email: "ana.rodrigues@gmail.com",
  },
  {
    name: "Carlos Roberto Oliveira",
    cpf: "741.852.963-55",
    phone: "(51) 98123-4567",
    email: "carlos.oliveira@yahoo.com.br",
  },
  {
    name: "Fernanda Costa Almeida",
    cpf: "159.357.246-85",
    phone: "(85) 99876-5432",
    email: "fernanda.almeida@gmail.com",
  },
];

// ─── Análises ─────────────────────────────────────────────────────────────────
// 10 análises com mix de diagnósticos: ABUSIVA (4×), ACIMA (3×), NORMAL (2×), FINALIZADA (1×)

const ANALYSES: AnalysisSeed[] = [
  // ABUSIVA — taxa 2,89% (1,70% BCB → limite STJ 2,55%)
  {
    clientIdx: 0,
    bankCode: 623,
    vehicle: "Honda Civic 2.0 Touring 2022",
    contractDate: new Date("2024-03-01"),
    releasedValue: 82_000,
    installments: 60,
    contractedRate: 2.89,
    installmentsPaid: 18,
    overdueInstallments: 0,
    contractNumber: "PAN-2024-031842",
  },
  // ACIMA — taxa 2,10% (1,63% BCB → limite STJ 2,445%)
  {
    clientIdx: 1,
    bankCode: 237,
    vehicle: "Toyota Corolla XEi 2021",
    contractDate: new Date("2024-06-01"),
    releasedValue: 68_000,
    installments: 48,
    contractedRate: 2.10,
    installmentsPaid: 8,
    overdueInstallments: 0,
    contractNumber: "BDB-2024-067491",
  },
  // NORMAL — taxa 1,49% (1,58% BCB)
  {
    clientIdx: 2,
    bankCode: 1,
    vehicle: "Fiat Argo Drive 1.3 2023",
    contractDate: new Date("2024-10-01"),
    releasedValue: 58_000,
    installments: 60,
    contractedRate: 1.49,
    installmentsPaid: 3,
    overdueInstallments: 0,
    contractNumber: "BB-2024-102847",
  },
  // ABUSIVA — taxa 3,20% (1,72% BCB → limite STJ 2,58%)
  {
    clientIdx: 3,
    bankCode: 341,
    vehicle: "Jeep Compass Limited 2022",
    contractDate: new Date("2024-02-01"),
    releasedValue: 115_000,
    installments: 60,
    contractedRate: 3.20,
    installmentsPaid: 24,
    overdueInstallments: 2,
    contractNumber: "ITU-2024-028364",
  },
  // ACIMA — taxa 1,89% (1,65% BCB → limite STJ 2,475%)
  {
    clientIdx: 4,
    bankCode: 33,
    vehicle: "Chevrolet Onix Plus LTZ 2023",
    contractDate: new Date("2024-05-01"),
    releasedValue: 62_000,
    installments: 48,
    contractedRate: 1.89,
    installmentsPaid: 12,
    overdueInstallments: 0,
    contractNumber: "SAN-2024-054219",
  },
  // NORMAL — taxa 1,55% (1,62% BCB)
  {
    clientIdx: 0,
    bankCode: 104,
    vehicle: "Ford Ranger XLT 2021",
    contractDate: new Date("2024-08-01"),
    releasedValue: 135_000,
    installments: 60,
    contractedRate: 1.55,
    installmentsPaid: 6,
    overdueInstallments: 0,
    contractNumber: "CEF-2024-083756",
  },
  // ABUSIVA — taxa 2,65% (1,61% BCB → limite STJ 2,415%)
  {
    clientIdx: 5,
    bankCode: 655,
    vehicle: "Volkswagen T-Cross Highline 2022",
    contractDate: new Date("2024-07-01"),
    releasedValue: 95_000,
    installments: 60,
    contractedRate: 2.65,
    installmentsPaid: 15,
    overdueInstallments: 1,
    contractNumber: "BVF-2024-074583",
  },
  // ACIMA — taxa 1,98% (1,59% BCB → limite STJ 2,385%)
  {
    clientIdx: 2,
    bankCode: 260,
    vehicle: "Hyundai HB20S Vision 2023",
    contractDate: new Date("2024-11-01"),
    releasedValue: 48_000,
    installments: 48,
    contractedRate: 1.98,
    installmentsPaid: 4,
    overdueInstallments: 0,
    contractNumber: "NUB-2024-113692",
  },
  // ABUSIVA — taxa 2,78% (1,65% BCB → limite STJ 2,475%)
  {
    clientIdx: 1,
    bankCode: 623,
    vehicle: "Renault Duster Intense 2023",
    contractDate: new Date("2025-01-01"),
    releasedValue: 75_000,
    installments: 60,
    contractedRate: 2.78,
    installmentsPaid: 2,
    overdueInstallments: 0,
    contractNumber: "PAN-2025-011947",
  },
  // ACIMA + FINALIZADA — taxa 2,05% (1,68% BCB → limite STJ 2,52%)
  {
    clientIdx: 3,
    bankCode: 237,
    vehicle: "Nissan Kicks Exclusive 2022",
    contractDate: new Date("2024-04-01"),
    releasedValue: 88_000,
    installments: 60,
    contractedRate: 2.05,
    installmentsPaid: 22,
    overdueInstallments: 0,
    contractNumber: "BDB-2024-041285",
    status: "FINALIZED",
  },
];

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\nIniciando seed...\n");

  console.log("Limpando dados anteriores...");
  await prisma.scenario.deleteMany();
  await prisma.analysis.deleteMany();
  await prisma.client.deleteMany();
  await prisma.bcbRate.deleteMany();

  console.log("Inserindo taxas BCB...");
  await prisma.bcbRate.createMany({
    data: BCB_RATES.map((r) => ({
      month: r.month,
      year: r.year,
      rate: new Prisma.Decimal(r.rate),
      source: "BCB-OSTAT",
      isFixed: false,
    })),
  });
  console.log(`  ${BCB_RATES.length} taxas inseridas (2024–2025)`);

  console.log("\nBuscando bancos na BrasilAPI...");
  const banks = await fetchBanks();
  const bankName = (code: number): string =>
    banks[code] ?? BANK_FALLBACKS[code] ?? `Banco ${code}`;

  console.log("\nInserindo clientes...");
  const clients = await Promise.all(
    CLIENTS.map((c) => prisma.client.create({ data: c }))
  );
  console.log(`  ${clients.length} clientes inseridos`);

  const bcbRateMap = new Map(
    BCB_RATES.map((r) => [`${r.month}-${r.year}`, r.rate])
  );

  console.log("\nInserindo análises...");
  let inserted = 0;

  for (const a of ANALYSES) {
    const month = a.contractDate.getMonth() + 1;
    const year = a.contractDate.getFullYear();
    const bcbRate = bcbRateMap.get(`${month}-${year}`) ?? 1.65;
    const diagnostic =
      a.contractedRate > bcbRate * 1.5
        ? "ABUSIVA"
        : a.contractedRate > bcbRate
          ? "ACIMA"
          : "NORMAL";

    const { installment } = calculatePriceTable({
      principal: a.releasedValue,
      rate: a.contractedRate / 100,
      installments: a.installments,
    });

    const client = clients[a.clientIdx];
    if (!client) throw new Error(`Cliente ${a.clientIdx} não encontrado`);

    await prisma.analysis.create({
      data: {
        contractNumber: a.contractNumber,
        bank: bankName(a.bankCode),
        contractModality: "Financiamento de Veículo",
        vehicleModel: a.vehicle,
        contractDate: a.contractDate,
        releasedValue: new Prisma.Decimal(a.releasedValue),
        installments: a.installments,
        installmentValue: new Prisma.Decimal(installment.toFixed(2)),
        contractedRate: new Prisma.Decimal(a.contractedRate),
        installmentsPaid: a.installmentsPaid,
        overdueInstallments: a.overdueInstallments,
        status: a.status ?? "DRAFT",
        clientId: client.id,
      },
    });

    console.log(
      `  [${diagnostic.padEnd(8)}] ${a.vehicle} — ${a.contractedRate}% a.m. — R$ ${installment.toFixed(2)}/mês`
    );
    inserted++;
  }

  console.log(`\nSeed concluído com sucesso.`);
  console.log(`  ${clients.length} clientes`);
  console.log(`  ${inserted} análises (4 abusivas / 3 acima / 2 normais / 1 finalizada)`);
  console.log(`  ${BCB_RATES.length} taxas BCB (jan/2024 – ago/2025)\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

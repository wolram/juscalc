import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"]! });
const prisma = new PrismaClient({ adapter });

const DATAJUD_KEY = "ApiKey cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==";

interface DataJudHit {
  _source: {
    numeroProcesso: string;
    classe?: { nome: string };
    tribunal: string;
    orgaoJulgador?: { nome: string } | null;
    assuntos?: Array<{ nome: string }>;
    dataAjuizamento?: string;
    movimentos?: Array<{ nome: string; dataHora: string; codigo: number }>;
  };
}

// Mapeia classe processual → ProcessType do nosso schema
function mapTipo(classe: string): "CIVIL" | "CRIMINAL" | "TRABALHISTA" | "PREVIDENCIARIO" | "TRIBUTARIO" | "FAMILIA" | "CONSUMIDOR" {
  const c = classe.toLowerCase();
  if (c.includes("trabalh") || c.includes("trt") || c.includes("reclamat")) return "TRABALHISTA";
  if (c.includes("penal") || c.includes("crimin") || c.includes("inquérito")) return "CRIMINAL";
  if (c.includes("previdenci") || c.includes("benefício") || c.includes("inss")) return "PREVIDENCIARIO";
  if (c.includes("tribut") || c.includes("fiscal") || c.includes("execução fiscal")) return "TRIBUTARIO";
  if (c.includes("família") || c.includes("divórcio") || c.includes("alimentos") || c.includes("guarda")) return "FAMILIA";
  if (c.includes("consumidor") || c.includes("cdc") || c.includes("procon")) return "CONSUMIDOR";
  return "CIVIL";
}

// Formata número CNJ: NNNNNNN-DD.AAAA.J.TT.OOOO
function formatCNJ(raw: string): string {
  const n = raw.replace(/\D/g, "");
  if (n.length !== 20) return raw;
  return `${n.slice(0,7)}-${n.slice(7,9)}.${n.slice(9,13)}.${n.slice(13,14)}.${n.slice(14,16)}.${n.slice(16)}`;
}

async function fetchProcessos(tribunal: string, size: number): Promise<DataJudHit[]> {
  const url = `https://api-publica.datajud.cnj.jus.br/api_publica_${tribunal}/_search`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": DATAJUD_KEY,
    },
    body: JSON.stringify({
      query: { match_all: {} },
      size,
      _source: ["numeroProcesso", "classe", "tribunal", "orgaoJulgador", "assuntos", "dataAjuizamento", "movimentos"],
    }),
  });

  if (!res.ok) {
    console.warn(`  [${tribunal.toUpperCase()}] HTTP ${res.status} — pulando`);
    return [];
  }

  const data = await res.json() as { hits?: { hits?: DataJudHit[] } };
  return data.hits?.hits ?? [];
}

async function main() {
  console.log("\nSeed de processos reais — DataJud/CNJ\n");

  const org = await prisma.organization.findFirst();
  if (!org) throw new Error("Rode primeiro: pnpm prisma db seed");

  const clients = await prisma.client.findMany({ where: { organizationId: org.id } });
  if (clients.length === 0) throw new Error("Nenhum cliente encontrado. Rode: pnpm prisma db seed");

  // Limpa processos anteriores
  console.log("Limpando processos anteriores...");
  await prisma.movement.deleteMany({});
  await prisma.deadline.deleteMany({ where: { organizationId: org.id } });
  await prisma.process.deleteMany({ where: { organizationId: org.id } });

  // Fontes: TRT1 (RJ), TRT2 (SP), TRT3 (MG), TJSP, TJRJ
  const fontes = [
    { tribunal: "trt1",  sigla: "TRT1", qtd: 4 },
    { tribunal: "trt2",  sigla: "TRT2", qtd: 4 },
    { tribunal: "trt3",  sigla: "TRT3", qtd: 2 },
    { tribunal: "tjsp",  sigla: "TJSP", qtd: 3 },
    { tribunal: "tjrj",  sigla: "TJRJ", qtd: 2 },
  ];

  let totalProcessos = 0;
  let totalMovimentos = 0;
  let clientIdx = 0;

  for (const fonte of fontes) {
    console.log(`\nBuscando ${fonte.qtd} processos em ${fonte.sigla}...`);
    const hits = await fetchProcessos(fonte.tribunal, fonte.qtd);

    for (const hit of hits) {
      const s = hit._source;
      const cnjRaw = s.numeroProcesso ?? "";
      const cnjFormatado = formatCNJ(cnjRaw);
      const classeNome = s.classe?.nome ?? "Procedimento Comum";
      const tipo = mapTipo(classeNome);
      const vara = typeof s.orgaoJulgador === "object" && s.orgaoJulgador
        ? s.orgaoJulgador.nome
        : fonte.sigla;
      const assunto = s.assuntos?.[0]?.nome ?? classeNome;
      const client = clients[clientIdx % clients.length];
      if (!client) continue;
      clientIdx++;

      const processo = await prisma.process.create({
        data: {
          cnjNumber:      cnjFormatado,
          court:          fonte.sigla,
          district:       vara,
          type:           tipo,
          subject:        assunto,
          status:         "ACTIVE",
          clientId:       client.id,
          organizationId: org.id,
        },
      });

      // Importa movimentos do DataJud (até 5 por processo)
      const movimentos = (s.movimentos ?? []).slice(0, 5);
      for (const mv of movimentos) {
        if (!mv.dataHora) continue;
        await prisma.movement.create({
          data: {
            processId:   processo.id,
            date:        new Date(mv.dataHora),
            description: mv.nome ?? "Movimentação",
            source:      "DATAJUD",
          },
        });
        totalMovimentos++;
      }

      console.log(`  [${tipo.padEnd(14)}] ${cnjFormatado} — ${assunto.slice(0, 50)}`);
      totalProcessos++;
    }
  }

  console.log(`\nSeed de processos concluído!`);
  console.log(`  ${totalProcessos} processos reais importados do DataJud`);
  console.log(`  ${totalMovimentos} movimentos importados`);
  console.log(`  Tribunais: TRT1, TRT2, TRT3, TJSP, TJRJ\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

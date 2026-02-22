/**
 * db-push.ts
 *
 * Usa DIRECT_URL (conexão direta ao Supabase, bypassando o pooler de transações)
 * para executar `prisma db push`. Necessário porque Prisma 7.4.1 não suporta
 * `directUrl` no defineConfig — apenas `url` e `shadowDatabaseUrl`.
 */
import "dotenv/config";
import { execFileSync } from "child_process";

const directUrl = process.env["DIRECT_URL"];

if (!directUrl) {
  console.error("Erro: DIRECT_URL não definido no .env");
  console.error("Adicione DIRECT_URL com a URL de conexão direta do Supabase (porta 5432).");
  process.exit(1);
}

console.log("Aplicando schema via conexão direta (DIRECT_URL)...\n");

execFileSync("pnpm", ["prisma", "db", "push"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: directUrl },
});

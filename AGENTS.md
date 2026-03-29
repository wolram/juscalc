# AGENTS.md — revisional

Sistema de revisão contratual bancária para **Dra. Isis Lisboa & Associados**.

---

## Contexto do Projeto

Plataforma web para análise de contratos de financiamento de veículos (e outras modalidades). O sistema compara a taxa contratada com a média BACEN, gera 3 cenários de revisão e emite laudos técnicos em PDF.

---

## Stack

- **Next.js 15** (App Router) + TypeScript strict
- **Prisma 7** + PostgreSQL (Supabase)
- **Supabase Auth** (SSR via `@supabase/ssr`)
- **shadcn/ui** dark mode + Tailwind CSS 4
- **@react-pdf/renderer** para geração de PDF server-side
- **pnpm** como gerenciador de pacotes

---

## Domínio

### Cenários de Revisão

| Enum | Descrição | Taxa |
|---|---|---|
| `BCB_AVERAGE` | Parâmetro BACEN | Taxa média do período |
| `FIXED_148` | Taxa Fixa | 1,48% a.m. |
| `BCB_150` | Limite STJ | 1,5× taxa BACEN |

### Diagnóstico Automático

- **NORMAL** — taxa ≤ BCB
- **ABOVE** — BCB < taxa ≤ 1,5× BCB
- **ABUSIVE** — taxa > 1,5× BCB (STJ REsp 1.061.530/RS)

### Fundamentação Jurídica

CDC art. 51, STJ REsp 1.061.530/RS, Res. BCB 4.855

---

## Arquitetura

```
src/
  app/
    (auth)/login/          # autenticação Supabase
    (dashboard)/           # área protegida
      dashboard/           # KPIs + gráfico mensal
      analyses/            # listagem + nova análise + detalhe
      clients/             # CRUD clientes
      rates/               # taxas BCB histórico
      settings/            # configurações do sistema
    api/
      analyses/[id]/pdf/   # geração PDF (GET + ?scenario=)
      bcb-sync/            # cron sync taxas BACEN
      analyses/            # CRUD REST
      clients/             # CRUD REST
      rates/               # consulta taxas
  components/
    analyses/              # analysis-form, scenario-comparison
    pdf/                   # laudo-template (6 seções)
    layout/                # sidebar, topbar, command-menu
  lib/
    calculations.ts        # Tabela Price, 3 cenários, diagnóstico
    bcb-api.ts             # fetch API pública BCB/OSTAT
  services/                # analysis, client, rates
  types/                   # tipos TypeScript
```

---

## Comandos

```bash
pnpm dev           # servidor local
pnpm build         # build produção
pnpm lint          # lint Next.js
pnpm tsc --noEmit  # type check
pnpm prisma generate          # gerar cliente Prisma
pnpm prisma migrate dev       # aplicar migrations
```

---

## Variáveis de Ambiente

```
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## Convenções

- Commits em português, imperativo: `"Adiciona campo modelo do veículo"`
- Branches: `feat/*`, `fix/*`, `chore/*`
- Nenhum `console.log` em produção
- Decimais monetários sempre via `Prisma.Decimal` — nunca `float` ou `number` direto no banco

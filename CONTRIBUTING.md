# Contribuindo com o JusCalc

## Pré-requisitos

- Node.js 20+
- pnpm 9+
- Banco PostgreSQL ou projeto Supabase configurado

## Setup rápido

```bash
pnpm install
cp .env.example .env.local
pnpm prisma:generate
pnpm prisma migrate dev
pnpm seed
pnpm dev
```

## Convenções do projeto

- Commits em português e no imperativo.
- Branches com prefixo `feat/`, `fix/` ou `chore/`.
- Não deixar `console.log` em código de produção.
- Persistência monetária e financeira sempre com `Prisma.Decimal`.
- Preferir alterações pequenas, coesas e fáceis de revisar.

## Antes de abrir PR

Rode:

```bash
pnpm check
pnpm build
```

## Estrutura sugerida para PR

- Explique o problema ou oportunidade.
- Resuma o que mudou em linguagem de produto e técnica.
- Liste como validar manualmente.
- Atualize documentação quando houver mudança de setup, fluxo ou domínio.

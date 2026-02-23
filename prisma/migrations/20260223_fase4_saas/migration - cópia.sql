-- ============================================================
-- Migração Fase 4 — JusCalc SaaS
-- Remove schema antigo e recria tudo com multi-tenancy
-- ============================================================

-- Drop tabelas existentes (cascade remove foreign keys automaticamente)
DROP TABLE IF EXISTS "Scenario"     CASCADE;
DROP TABLE IF EXISTS "Analysis"     CASCADE;
DROP TABLE IF EXISTS "Client"       CASCADE;
DROP TABLE IF EXISTS "BcbRate"      CASCADE;

-- Drop enums existentes
DROP TYPE IF EXISTS "AnalysisStatus" CASCADE;
DROP TYPE IF EXISTS "ScenarioType"   CASCADE;

-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE "AnalysisStatus" AS ENUM ('DRAFT', 'FINALIZED');
CREATE TYPE "ScenarioType"   AS ENUM ('BCB_AVERAGE', 'FIXED_148', 'BCB_150', 'CUSTOM');
CREATE TYPE "PlanTier"       AS ENUM ('FREE', 'STARTER', 'PRO', 'ENTERPRISE');
CREATE TYPE "MemberRole"     AS ENUM ('OWNER', 'ADMIN', 'LAWYER', 'ASSISTANT');
CREATE TYPE "CalcType"       AS ENUM ('REVISIONAL', 'TRABALHISTA', 'PREVIDENCIARIO', 'ALIMENTOS', 'DANOS_MORAIS', 'ALUGUEL', 'HONORARIOS');
CREATE TYPE "ProcessType"    AS ENUM ('CIVIL', 'CRIMINAL', 'TRABALHISTA', 'PREVIDENCIARIO', 'TRIBUTARIO', 'FAMILIA', 'CONSUMIDOR');
CREATE TYPE "ProcessStatus"  AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED', 'CLOSED');
CREATE TYPE "DeadlineType"   AS ENUM ('MANIFESTATION', 'HEARING', 'APPEAL', 'DOCUMENT', 'OTHER');
CREATE TYPE "DeadlineStatus" AS ENUM ('PENDING', 'DONE', 'MISSED');
CREATE TYPE "FinanceType"    AS ENUM ('INCOME', 'EXPENSE');
CREATE TYPE "FinanceStatus"  AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');
CREATE TYPE "PostType"       AS ENUM ('ARTICLE', 'QUESTION', 'CASE_STUDY');
CREATE TYPE "LegalArea"      AS ENUM ('CIVIL', 'CRIMINAL', 'TRABALHISTA', 'PREVIDENCIARIO', 'FAMILIA', 'TRIBUTARIO', 'CONSUMIDOR', 'EMPRESARIAL');

-- ─── Tabelas novas (multi-tenancy) ───────────────────────────────────────────

CREATE TABLE "Organization" (
    "id"        TEXT        NOT NULL,
    "name"      TEXT        NOT NULL,
    "slug"      TEXT        NOT NULL,
    "plan"      "PlanTier"  NOT NULL DEFAULT 'FREE',
    "logoUrl"   TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Member" (
    "id"             TEXT          NOT NULL,
    "userId"         TEXT          NOT NULL,
    "organizationId" TEXT          NOT NULL,
    "role"           "MemberRole"  NOT NULL DEFAULT 'LAWYER',
    "createdAt"      TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- ─── Tabelas do core (recriadas com organizationId) ──────────────────────────

CREATE TABLE "Client" (
    "id"             TEXT         NOT NULL,
    "name"           TEXT         NOT NULL,
    "cpf"            TEXT,
    "phone"          TEXT,
    "email"          TEXT,
    "organizationId" TEXT         NOT NULL,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Analysis" (
    "id"                  TEXT              NOT NULL,
    "contractNumber"      TEXT              NOT NULL,
    "bank"                TEXT              NOT NULL,
    "contractModality"    TEXT              NOT NULL DEFAULT 'Financiamento de Veículo',
    "vehicleModel"        TEXT,
    "contractDate"        TIMESTAMP(3)      NOT NULL,
    "releasedValue"       DECIMAL(15,2)     NOT NULL,
    "installments"        INTEGER           NOT NULL,
    "installmentValue"    DECIMAL(15,2)     NOT NULL,
    "contractedRate"      DECIMAL(8,4)      NOT NULL,
    "installmentsPaid"    INTEGER           NOT NULL DEFAULT 0,
    "overdueInstallments" INTEGER           NOT NULL DEFAULT 0,
    "status"              "AnalysisStatus"  NOT NULL DEFAULT 'DRAFT',
    "clientId"            TEXT              NOT NULL,
    "organizationId"      TEXT              NOT NULL,
    "pdfUrl"              TEXT,
    "createdAt"           TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"           TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Scenario" (
    "id"                 TEXT           NOT NULL,
    "type"               "ScenarioType" NOT NULL,
    "rate"               DECIMAL(8,4)   NOT NULL,
    "monthlyInstallment" DECIMAL(15,2)  NOT NULL,
    "totalDue"           DECIMAL(15,2)  NOT NULL,
    "totalPaid"          DECIMAL(15,2)  NOT NULL,
    "overpaid"           DECIMAL(15,2)  NOT NULL,
    "savings"            DECIMAL(15,2)  NOT NULL,
    "reductionPct"       DECIMAL(8,4)   NOT NULL,
    "isAbusive"          BOOLEAN        NOT NULL,
    "analysisId"         TEXT           NOT NULL,
    "createdAt"          TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"          TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BcbRate" (
    "id"        TEXT         NOT NULL,
    "month"     INTEGER      NOT NULL,
    "year"      INTEGER      NOT NULL,
    "rate"      DECIMAL(8,4) NOT NULL,
    "source"    TEXT         NOT NULL DEFAULT 'BCB-OSTAT',
    "isFixed"   BOOLEAN      NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BcbRate_pkey" PRIMARY KEY ("id")
);

-- ─── Tabelas dos módulos novos ────────────────────────────────────────────────

CREATE TABLE "Calculation" (
    "id"             TEXT         NOT NULL,
    "type"           "CalcType"   NOT NULL,
    "input"          JSONB        NOT NULL,
    "result"         JSONB        NOT NULL,
    "organizationId" TEXT         NOT NULL,
    "clientId"       TEXT,
    "processId"      TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Calculation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Process" (
    "id"             TEXT            NOT NULL,
    "cnjNumber"      TEXT            NOT NULL,
    "court"          TEXT            NOT NULL,
    "district"       TEXT,
    "judge"          TEXT,
    "type"           "ProcessType"   NOT NULL,
    "status"         "ProcessStatus" NOT NULL DEFAULT 'ACTIVE',
    "subject"        TEXT            NOT NULL,
    "clientId"       TEXT            NOT NULL,
    "organizationId" TEXT            NOT NULL,
    "createdAt"      TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Process_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Movement" (
    "id"          TEXT         NOT NULL,
    "processId"   TEXT         NOT NULL,
    "date"        TIMESTAMP(3) NOT NULL,
    "description" TEXT         NOT NULL,
    "source"      TEXT         NOT NULL DEFAULT 'MANUAL',
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Movement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Deadline" (
    "id"        TEXT             NOT NULL,
    "processId" TEXT             NOT NULL,
    "title"     TEXT             NOT NULL,
    "dueDate"   TIMESTAMP(3)     NOT NULL,
    "type"      "DeadlineType"   NOT NULL,
    "status"    "DeadlineStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Deadline_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Document" (
    "id"         TEXT         NOT NULL,
    "processId"  TEXT         NOT NULL,
    "name"       TEXT         NOT NULL,
    "url"        TEXT         NOT NULL,
    "mimeType"   TEXT         NOT NULL DEFAULT 'application/pdf',
    "sizeBytes"  INTEGER      NOT NULL DEFAULT 0,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Finance" (
    "id"             TEXT            NOT NULL,
    "type"           "FinanceType"   NOT NULL,
    "category"       TEXT            NOT NULL,
    "description"    TEXT            NOT NULL,
    "amount"         DECIMAL(15,2)   NOT NULL,
    "dueDate"        TIMESTAMP(3)    NOT NULL,
    "paidAt"         TIMESTAMP(3),
    "status"         "FinanceStatus" NOT NULL DEFAULT 'PENDING',
    "clientId"       TEXT,
    "processId"      TEXT,
    "organizationId" TEXT            NOT NULL,
    "createdAt"      TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Finance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Post" (
    "id"             TEXT         NOT NULL,
    "title"          TEXT         NOT NULL,
    "content"        TEXT         NOT NULL,
    "type"           "PostType"   NOT NULL,
    "area"           "LegalArea"  NOT NULL,
    "authorId"       TEXT         NOT NULL,
    "organizationId" TEXT         NOT NULL,
    "upvotes"        INTEGER      NOT NULL DEFAULT 0,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Template" (
    "id"          TEXT         NOT NULL,
    "title"       TEXT         NOT NULL,
    "description" TEXT         NOT NULL,
    "content"     TEXT         NOT NULL,
    "type"        TEXT         NOT NULL,
    "area"        "LegalArea"  NOT NULL,
    "authorId"    TEXT         NOT NULL,
    "downloads"   INTEGER      NOT NULL DEFAULT 0,
    "isPublic"    BOOLEAN      NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- ─── Índices únicos ───────────────────────────────────────────────────────────

CREATE UNIQUE INDEX "Organization_slug_key"              ON "Organization"("slug");
CREATE UNIQUE INDEX "Member_userId_organizationId_key"   ON "Member"("userId", "organizationId");
CREATE UNIQUE INDEX "BcbRate_month_year_isFixed_key"     ON "BcbRate"("month", "year", "isFixed");

-- ─── Foreign keys ─────────────────────────────────────────────────────────────

ALTER TABLE "Member"      ADD CONSTRAINT "Member_organizationId_fkey"      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Client"      ADD CONSTRAINT "Client_organizationId_fkey"      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Analysis"    ADD CONSTRAINT "Analysis_clientId_fkey"          FOREIGN KEY ("clientId")       REFERENCES "Client"("id")       ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Analysis"    ADD CONSTRAINT "Analysis_organizationId_fkey"    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Scenario"    ADD CONSTRAINT "Scenario_analysisId_fkey"        FOREIGN KEY ("analysisId")     REFERENCES "Analysis"("id")     ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "Calculation" ADD CONSTRAINT "Calculation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Process"     ADD CONSTRAINT "Process_clientId_fkey"           FOREIGN KEY ("clientId")       REFERENCES "Client"("id")       ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Process"     ADD CONSTRAINT "Process_organizationId_fkey"     FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Movement"    ADD CONSTRAINT "Movement_processId_fkey"         FOREIGN KEY ("processId")      REFERENCES "Process"("id")      ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "Deadline"    ADD CONSTRAINT "Deadline_processId_fkey"         FOREIGN KEY ("processId")      REFERENCES "Process"("id")      ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "Document"    ADD CONSTRAINT "Document_processId_fkey"         FOREIGN KEY ("processId")      REFERENCES "Process"("id")      ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "Finance"     ADD CONSTRAINT "Finance_clientId_fkey"           FOREIGN KEY ("clientId")       REFERENCES "Client"("id")       ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Finance"     ADD CONSTRAINT "Finance_processId_fkey"          FOREIGN KEY ("processId")      REFERENCES "Process"("id")      ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Finance"     ADD CONSTRAINT "Finance_organizationId_fkey"     FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Post"        ADD CONSTRAINT "Post_organizationId_fkey"        FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

import type { Analysis, Client, Scenario, BcbRate } from "@prisma/client";

export type { Analysis, Client, Scenario, BcbRate };

export type AnalysisStatus = "DRAFT" | "FINALIZED";
export type ScenarioType = "BCB_AVERAGE" | "FIXED_148" | "BCB_150" | "CUSTOM";

export interface SerializedAnalysis {
  id: string;
  contractNumber: string;
  bank: string;
  contractModality: string;
  vehicleModel: string | null;
  contractDate: string;
  releasedValue: number;
  installments: number;
  installmentValue: number;
  contractedRate: number;
  installmentsPaid: number;
  overdueInstallments: number;
  status: AnalysisStatus;
  clientId: string;
  client: {
    id: string;
    name: string;
    cpf: string | null;
    phone: string | null;
    email: string | null;
    createdAt: string;
    updatedAt: string;
  };
  scenarios: Array<{
    id: string;
    type: ScenarioType;
    rate: number;
    monthlyInstallment: number;
    totalDue: number;
    totalPaid: number;
    overpaid: number;
    savings: number;
    reductionPct: number;
    isAbusive: boolean;
    analysisId: string;
    createdAt: string;
    updatedAt: string;
  }>;
  pdfUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisWithRelations extends Analysis {
  client: Client;
  scenarios: Scenario[];
}

export interface ClientWithAnalyses extends Client {
  analyses: Analysis[];
}

export interface DashboardStats {
  totalAnalyses: number;
  totalClients: number;
  totalFinalized: number;
  totalRecoverable: number;
  monthlyData: MonthlyData[];
}

export interface MonthlyData {
  month: string;
  analyses: number;
  value: number;
}

export interface CreateAnalysisInput {
  contractNumber: string;
  bank: string;
  contractModality: string;
  vehicleModel?: string;
  contractDate: string;
  releasedValue: number;
  installments: number;
  installmentValue: number;
  contractedRate: number;
  installmentsPaid: number;
  overdueInstallments: number;
  clientId: string;
}

export interface CreateClientInput {
  name: string;
  cpf?: string;
  phone?: string;
  email?: string;
}

export interface UpdateClientInput {
  name?: string;
  cpf?: string;
  phone?: string;
  email?: string;
}

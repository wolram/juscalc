import type { Analysis, Client, Scenario, BcbRate } from "@prisma/client";

export type { Analysis, Client, Scenario, BcbRate };

export type AnalysisStatus = "DRAFT" | "FINALIZED";
export type ScenarioType = "BCB_AVERAGE" | "FIXED_148" | "BCB_150" | "CUSTOM";

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

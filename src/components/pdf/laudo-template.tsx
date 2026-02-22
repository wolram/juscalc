import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { DiagnosticResult, ScenarioResult } from "@/lib/calculations";
import type { AnalysisWithRelations } from "@/types";

interface LaudoDocumentProps {
  analysis: AnalysisWithRelations;
  scenarios: ScenarioResult[];
  diagnostic: DiagnosticResult;
  conclusion: string;
  bcbRate: number;
}

const COLORS = {
  black: "#0f0f0f",
  medGray: "#374151",
  lightGray: "#6b7280",
  border: "#e5e7eb",
  bgMuted: "#f3f4f6",
  primary: "#1d4ed8",
  green: "#15803d",
  greenLight: "#dcfce7",
  yellow: "#b45309",
  yellowLight: "#fef3c7",
  red: "#b91c1c",
  redLight: "#fee2e2",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: COLORS.black,
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 40,
    lineHeight: 1.4,
  },
  headerContainer: {
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: COLORS.primary,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 9,
    color: COLORS.lightGray,
  },
  headerMeta: {
    fontSize: 8,
    color: COLORS.lightGray,
    marginTop: 4,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: COLORS.primary,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  row: {
    flexDirection: "row",
    marginBottom: 3,
  },
  col2: {
    flex: 1,
  },
  dataLabel: {
    fontSize: 8,
    color: COLORS.lightGray,
    marginBottom: 1,
  },
  dataValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.black,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.bgMuted,
    padding: 5,
    marginBottom: 1,
    borderRadius: 2,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableCell: {
    flex: 1,
    fontSize: 8,
  },
  tableCellBold: {
    flex: 1,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  tableCellRight: {
    flex: 1,
    fontSize: 8,
    textAlign: "right",
  },
  tableCellRightBold: {
    flex: 1,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLORS.medGray,
  },
  tableHeaderCellRight: {
    flex: 1,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLORS.medGray,
    textAlign: "right",
  },
  badgeGreen: {
    backgroundColor: COLORS.greenLight,
    borderRadius: 4,
    padding: 6,
    marginBottom: 4,
  },
  badgeYellow: {
    backgroundColor: COLORS.yellowLight,
    borderRadius: 4,
    padding: 6,
    marginBottom: 4,
  },
  badgeRed: {
    backgroundColor: COLORS.redLight,
    borderRadius: 4,
    padding: 6,
    marginBottom: 4,
  },
  badgeTitleGreen: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: COLORS.green,
    marginBottom: 2,
  },
  badgeTitleYellow: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: COLORS.yellow,
    marginBottom: 2,
  },
  badgeTitleRed: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: COLORS.red,
    marginBottom: 2,
  },
  badgeDesc: {
    fontSize: 8,
    color: COLORS.medGray,
  },
  conclusionText: {
    fontSize: 8.5,
    color: COLORS.medGray,
    lineHeight: 1.6,
    textAlign: "justify",
  },
  disclaimer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    fontSize: 7,
    color: COLORS.lightGray,
    textAlign: "justify",
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7,
    color: COLORS.lightGray,
  },
});

function fmtBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
}

function fmtPct(value: number): string {
  return `${value.toFixed(4).replace(".", ",")}%`;
}

function fmtDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("pt-BR");
}

export function LaudoDocument({
  analysis,
  scenarios,
  diagnostic,
  conclusion,
  bcbRate,
}: LaudoDocumentProps) {
  const contractedRate = Number(analysis.contractedRate);
  const releasedValue = Number(analysis.releasedValue);
  const installmentValue = Number(analysis.installmentValue);
  const totalPaid = installmentValue * analysis.installmentsPaid;

  const diagBadgeStyle =
    diagnostic.color === "green"
      ? styles.badgeGreen
      : diagnostic.color === "yellow"
        ? styles.badgeYellow
        : styles.badgeRed;

  const diagTitleStyle =
    diagnostic.color === "green"
      ? styles.badgeTitleGreen
      : diagnostic.color === "yellow"
        ? styles.badgeTitleYellow
        : styles.badgeTitleRed;

  const bcbScenario = scenarios.find((s) => s.type === "BCB_AVERAGE");

  return (
    <Document
      title={`Laudo Revisional — ${analysis.client.name}`}
      author="Dra. Isis Lisboa & Associados"
      subject="Laudo Técnico de Revisão Contratual"
    >
      <Page size="A4" style={styles.page}>
        {/* CABEÇALHO */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Laudo Técnico de Revisão Contratual</Text>
          <Text style={styles.headerSubtitle}>
            Dra. Isis Lisboa & Associados — Revisão de Financiamento Bancário
          </Text>
          <Text style={styles.headerMeta}>
            Cliente: {analysis.client.name}{"   "}|{"   "}Emitido em: {fmtDate(new Date())}
          </Text>
        </View>

        {/* SEÇÃO 1 — Identificação do Contrato */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Identificação do Contrato</Text>
          <View style={styles.row}>
            <View style={styles.col2}>
              <Text style={styles.dataLabel}>Instituição Financeira</Text>
              <Text style={styles.dataValue}>{analysis.bank}</Text>
            </View>
            <View style={styles.col2}>
              <Text style={styles.dataLabel}>Modalidade</Text>
              <Text style={styles.dataValue}>{analysis.contractModality}</Text>
            </View>
          </View>
          {analysis.vehicleModel ? (
            <View style={[styles.row, { marginTop: 4 }]}>
              <View style={styles.col2}>
                <Text style={styles.dataLabel}>Modelo do Veículo</Text>
                <Text style={styles.dataValue}>{analysis.vehicleModel}</Text>
              </View>
              <View style={styles.col2} />
            </View>
          ) : null}
          <View style={[styles.row, { marginTop: 4 }]}>
            <View style={styles.col2}>
              <Text style={styles.dataLabel}>Data da Contratação</Text>
              <Text style={styles.dataValue}>{fmtDate(analysis.contractDate)}</Text>
            </View>
            <View style={styles.col2}>
              <Text style={styles.dataLabel}>Valor Financiado</Text>
              <Text style={styles.dataValue}>{fmtBRL(releasedValue)}</Text>
            </View>
          </View>
          <View style={[styles.row, { marginTop: 4 }]}>
            <View style={styles.col2}>
              <Text style={styles.dataLabel}>Total de Parcelas</Text>
              <Text style={styles.dataValue}>{analysis.installments}x</Text>
            </View>
            <View style={styles.col2}>
              <Text style={styles.dataLabel}>Taxa de Juros Contratada</Text>
              <Text style={styles.dataValue}>{fmtPct(contractedRate)} a.m.</Text>
            </View>
          </View>
        </View>

        {/* SEÇÃO 2 — Informações Declaradas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Informações Declaradas do Contrato</Text>
          <View style={styles.row}>
            <View style={styles.col2}>
              <Text style={styles.dataLabel}>Valor da Parcela Atual</Text>
              <Text style={styles.dataValue}>{fmtBRL(installmentValue)}</Text>
            </View>
            <View style={styles.col2}>
              <Text style={styles.dataLabel}>Parcelas Pagas</Text>
              <Text style={styles.dataValue}>{analysis.installmentsPaid}</Text>
            </View>
          </View>
          <View style={[styles.row, { marginTop: 4 }]}>
            <View style={styles.col2}>
              <Text style={styles.dataLabel}>Valor Total Já Pago</Text>
              <Text style={styles.dataValue}>{fmtBRL(totalPaid)}</Text>
            </View>
            <View style={styles.col2}>
              <Text style={styles.dataLabel}>Parcelas em Atraso</Text>
              <Text style={styles.dataValue}>{analysis.overdueInstallments}</Text>
            </View>
          </View>
        </View>

        {/* SEÇÃO 3 — Comparação BACEN */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            3. Comparação com Parâmetro de Mercado (BACEN)
          </Text>
          <View style={styles.row}>
            <View style={styles.col2}>
              <Text style={styles.dataLabel}>Taxa Média BACEN (período)</Text>
              <Text style={styles.dataValue}>{fmtPct(bcbRate)} a.m.</Text>
            </View>
            <View style={styles.col2}>
              <Text style={styles.dataLabel}>Parcela Estimada BACEN</Text>
              <Text style={styles.dataValue}>
                {bcbScenario ? fmtBRL(bcbScenario.installment) : "—"}
              </Text>
            </View>
          </View>
          {bcbScenario && bcbScenario.monthlyDiff > 0 ? (
            <View style={[styles.row, { marginTop: 4 }]}>
              <View style={styles.col2}>
                <Text style={styles.dataLabel}>Diferença Mensal (pago a mais)</Text>
                <Text style={styles.dataValue}>{fmtBRL(bcbScenario.monthlyDiff)}</Text>
              </View>
              <View style={styles.col2}>
                <Text style={styles.dataLabel}>Total Já Desembolsado a Maior</Text>
                <Text style={styles.dataValue}>{fmtBRL(bcbScenario.overpaid)}</Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* SEÇÃO 4 — Projeção 3 Cenários */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            4. Projeção Financeira Estimativa — 3 Cenários
          </Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Cenário</Text>
            <Text style={styles.tableHeaderCell}>Taxa a.m.</Text>
            <Text style={styles.tableHeaderCellRight}>Parcela</Text>
            <Text style={styles.tableHeaderCellRight}>Red. Mensal</Text>
            <Text style={styles.tableHeaderCellRight}>% Red.</Text>
            <Text style={styles.tableHeaderCellRight}>Pago a Maior</Text>
            <Text style={styles.tableHeaderCellRight}>Economia</Text>
          </View>
          {scenarios.map((s) => (
            <View key={s.type} style={styles.tableRow}>
              <Text style={[styles.tableCellBold, { flex: 1.5 }]}>{s.label}</Text>
              <Text style={styles.tableCell}>{fmtPct(s.rate)}</Text>
              <Text style={styles.tableCellRightBold}>{fmtBRL(s.installment)}</Text>
              <Text style={styles.tableCellRight}>
                {s.monthlyDiff > 0 ? fmtBRL(s.monthlyDiff) : "—"}
              </Text>
              <Text style={styles.tableCellRight}>
                {s.reductionPct > 0 ? `${s.reductionPct.toFixed(1)}%` : "—"}
              </Text>
              <Text style={styles.tableCellRight}>
                {s.overpaid > 0 ? fmtBRL(s.overpaid) : "—"}
              </Text>
              <Text style={styles.tableCellRight}>
                {s.savings > 0 ? fmtBRL(s.savings) : "—"}
              </Text>
            </View>
          ))}
        </View>

        {/* SEÇÃO 5 — Diagnóstico */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Diagnóstico Comparativo Automático</Text>
          <View style={diagBadgeStyle}>
            <Text style={diagTitleStyle}>{diagnostic.label}</Text>
            <Text style={styles.badgeDesc}>{diagnostic.description}</Text>
          </View>
        </View>

        {/* SEÇÃO 6 — Conclusão */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Conclusão Automática</Text>
          <Text style={styles.conclusionText}>{conclusion}</Text>
          <View style={styles.disclaimer}>
            <Text>
              O presente relatório possui caráter técnico-informativo e estimativo, não
              representando garantia de resultado, dependendo qualquer medida de análise completa
              da documentação e apreciação pelo Poder Judiciário. Fundamentação: CDC art. 51,
              STJ REsp 1.061.530/RS, Res. BCB n. 4.855/2020.
            </Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Dra. Isis Lisboa & Associados — Revisão Contratual Bancária
          </Text>
          <Text style={styles.footerText}>
            {analysis.client.name} — Emitido em {fmtDate(new Date())}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

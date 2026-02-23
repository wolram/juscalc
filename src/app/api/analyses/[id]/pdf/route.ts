import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getAnalysisById } from "@/services/analysis.service";
import { getRateForMonth } from "@/services/rates.service";
import { calculateScenarios, generateConclusion, getDiagnostic } from "@/lib/calculations";
import { LaudoDocument } from "@/components/pdf/laudo-template";
import React from "react";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const scenarioFilter = request.nextUrl.searchParams.get("scenario");

  const analysis = await getAnalysisById(id);
  if (!analysis) {
    return NextResponse.json({ error: "Análise não encontrada" }, { status: 404 });
  }

  const contractDate = new Date(analysis.contractDate);
  const bcbRate = await getRateForMonth(
    contractDate.getMonth() + 1,
    contractDate.getFullYear()
  );

  const bcbRateValue = bcbRate ? Number(bcbRate.rate) : 1.5;

  const contractInput = {
    releasedValue: Number(analysis.releasedValue),
    installments: analysis.installments,
    installmentValue: Number(analysis.installmentValue),
    contractedRate: Number(analysis.contractedRate),
    installmentsPaid: analysis.installmentsPaid,
  };

  let scenarios = calculateScenarios(contractInput, bcbRateValue);

  if (scenarioFilter) {
    scenarios = scenarios.filter((s) => s.type === scenarioFilter);
  }

  const diagnostic = getDiagnostic(contractInput.contractedRate, bcbRateValue);
  const conclusion = generateConclusion(contractInput, bcbRateValue, scenarios);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const document = React.createElement(LaudoDocument as any, {
    analysis,
    scenarios,
    diagnostic,
    conclusion,
    bcbRate: bcbRateValue,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(document as any);

  const filename = scenarioFilter
    ? `laudo-${id}-${scenarioFilter.toLowerCase()}.pdf`
    : `laudo-${id}-completo.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

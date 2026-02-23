import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listRates } from "@/services/rates.service";
import { formatPercent } from "@/lib/formatters";

const MONTH_NAMES = [
  "",
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

async function RatesContent() {
  const rates = await listRates(24);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Taxas BCB</h1>
          <p className="text-muted-foreground text-sm">Taxas médias de mercado (BACEN)</p>
        </div>
        <a
          href="/api/bcb-sync"
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors"
        >
          Sincronizar BACEN
        </a>
      </div>

      {rates.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma taxa cadastrada. Clique em &quot;Sincronizar BACEN&quot; para buscar os dados.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Histórico de Taxas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {rates.map((rate) => (
                <div key={rate.id} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm">
                    {MONTH_NAMES[rate.month]} {rate.year}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono font-medium">
                      {formatPercent(Number(rate.rate))} a.m.
                    </span>
                    <span className="text-xs text-muted-foreground">{rate.source}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function RatesPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground text-sm">Carregando...</div>}>
      <RatesContent />
    </Suspense>
  );
}

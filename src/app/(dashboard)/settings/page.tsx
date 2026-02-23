import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground text-sm">Preferências do sistema</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Sobre o Sistema</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          {(
            [
              ["Sistema", "Revisional — Análise Contratual Bancária"],
              ["Versão", "1.0.0"],
              ["Escritório", "Dra. Isis Lisboa & Associados"],
              ["Especialidade", "Revisão de Financiamento de Veículos"],
              ["Fundamentação", "CDC art. 51, STJ REsp 1.061.530/RS, Res. BCB 4.855/2020"],
            ] as [string, string][]
          ).map(([label, value]) => (
            <div key={label} className="flex justify-between gap-2">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium text-right">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

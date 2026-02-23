"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface ResultRow {
  label: string;
  value: string;
  highlight?: boolean;
}

interface CalcResultCardProps {
  title: string;
  rows: ResultRow[];
  observations?: string[];
  onSave?: () => void;
  saving?: boolean;
}

export function CalcResultCard({
  title,
  rows,
  observations,
  onSave,
  saving,
}: CalcResultCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          {onSave && (
            <Button size="sm" variant="outline" onClick={onSave} disabled={saving}>
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          {rows.map((row) => (
            <div
              key={row.label}
              className={`flex items-center justify-between rounded-md px-3 py-2 ${
                row.highlight
                  ? "bg-primary/10 font-semibold text-primary"
                  : "bg-muted/40 text-sm"
              }`}
            >
              <span className={row.highlight ? "text-sm font-medium" : "text-muted-foreground"}>
                {row.label}
              </span>
              <span className={row.highlight ? "text-base font-bold" : "font-medium"}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {observations && observations.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground">Observações</p>
            {observations.map((obs, i) => (
              <Badge key={i} variant="outline" className="text-xs font-normal w-full justify-start">
                {obs}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

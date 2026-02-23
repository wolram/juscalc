import Link from "next/link";
import {
  Calculator,
  Briefcase,
  Shield,
  Heart,
  AlertTriangle,
  Home,
  Scale,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const modules = [
  {
    href: "/calculations/trabalhista",
    icon: Briefcase,
    title: "Trabalhista",
    description: "Rescisão, horas extras, férias e 13°",
    badge: "CLT + TST",
    color: "text-blue-500",
  },
  {
    href: "/calculations/previdenciario",
    icon: Shield,
    title: "Previdenciário",
    description: "RMI, DIB, juros INSS e reafirmação de DER",
    badge: "LBPS",
    color: "text-green-500",
  },
  {
    href: "/calculations/alimentos",
    icon: Heart,
    title: "Alimentos",
    description: "Quantum, acumulação de parcelas e revisão",
    badge: "CC + CPC",
    color: "text-pink-500",
  },
  {
    href: "/calculations/danos-morais",
    icon: AlertTriangle,
    title: "Danos Morais",
    description: "Quantum por área com precedentes STJ",
    badge: "Método bifásico",
    color: "text-orange-500",
  },
  {
    href: "/calculations/aluguel",
    icon: Home,
    title: "Locatício",
    description: "Aluguel em atraso com IGP-M, IPCA ou SELIC",
    badge: "Lei 8.245/91",
    color: "text-purple-500",
  },
  {
    href: "/calculations/honorarios",
    icon: Scale,
    title: "Honorários",
    description: "Sucumbência (CPC art. 85), resultado e por hora",
    badge: "CPC + OAB",
    color: "text-yellow-500",
  },
];

export default function CalculationsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Cálculos Jurídicos</h1>
        <p className="text-muted-foreground text-sm">
          Módulos especializados por área do direito
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((mod) => (
          <Link key={mod.href} href={mod.href} className="group">
            <Card className="h-full transition-colors hover:border-primary/50">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className={`rounded-lg bg-muted p-2 ${mod.color}`}>
                    <mod.icon className="h-5 w-5" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {mod.badge}
                  </Badge>
                </div>
                <CardTitle className="text-base mt-2">{mod.title}</CardTitle>
                <CardDescription className="text-xs">{mod.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1 text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Acessar módulo <ArrowRight className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {/* Card revisional existente */}
        <Link href="/analyses" className="group">
          <Card className="h-full transition-colors hover:border-primary/50">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="rounded-lg bg-muted p-2 text-accent">
                  <Calculator className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="text-xs">
                  Revisional
                </Badge>
              </div>
              <CardTitle className="text-base mt-2">Bancário</CardTitle>
              <CardDescription className="text-xs">
                Revisão de financiamentos com Tabela Price e critério STJ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Ir para análises <ArrowRight className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

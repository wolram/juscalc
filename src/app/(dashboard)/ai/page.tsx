import Link from "next/link";
import { Bot, FileText, Search, MessageSquare, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const tools = [
  {
    href: "/ai/petition",
    icon: FileText,
    title: "Gerador de Petições",
    description: "Redija petições, recursos e manifestações com IA",
    badge: "Geração",
    color: "text-blue-500",
  },
  {
    href: "/ai/chat",
    icon: MessageSquare,
    title: "Assistente Jurídico",
    description: "Chat livre com contexto do processo ativo (streaming)",
    badge: "Chat",
    color: "text-green-500",
  },
  {
    href: "/ai/analyze",
    icon: Search,
    title: "Análise de Documento",
    description: "Cole um documento para extrair fatos, riscos e recomendações",
    badge: "Análise",
    color: "text-purple-500",
  },
];

export default function AIHubPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
          <Bot className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">IA Jurídica</h1>
          <p className="text-muted-foreground text-sm">
            Powered by Claude — Anthropic
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link key={tool.href} href={tool.href} className="group">
            <Card className="h-full transition-colors hover:border-primary/50">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className={`rounded-lg bg-muted p-2 ${tool.color}`}>
                    <tool.icon className="h-5 w-5" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {tool.badge}
                  </Badge>
                </div>
                <CardTitle className="text-base mt-2">{tool.title}</CardTitle>
                <CardDescription className="text-xs">{tool.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1 text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Abrir <ArrowRight className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Aviso:</strong> As respostas geradas por IA são auxiliares e não substituem a análise
          jurídica profissional. Sempre revise o conteúdo gerado antes de utilizar em peças processuais.
          As informações fornecidas têm caráter orientativo.
        </p>
      </div>
    </div>
  );
}

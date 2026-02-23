import { Suspense } from "react";
import Link from "next/link";
import { Plus, BookOpen, ThumbsUp, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listPosts, listTemplates } from "@/services/community.service";

const AREA_LABELS: Record<string, string> = {
  CIVIL: "Cível",
  CRIMINAL: "Criminal",
  TRABALHISTA: "Trabalhista",
  PREVIDENCIARIO: "Previdenciário",
  FAMILIA: "Família",
  TRIBUTARIO: "Tributário",
  CONSUMIDOR: "Consumidor",
  EMPRESARIAL: "Empresarial",
};

const TYPE_LABELS: Record<string, string> = {
  ARTICLE: "Artigo",
  QUESTION: "Dúvida",
  CASE_STUDY: "Case",
};

async function PostsList() {
  const { data: posts } = await listPosts({ limit: 15 });

  if (posts.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center">
        Nenhum post ainda. Seja o primeiro a publicar!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {posts.map((post) => (
        <Card key={post.id} className="hover:border-primary/30 transition-colors">
          <CardContent className="py-3 px-4">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-1 text-center">
                <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium">{post.upvotes}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <Badge variant="outline" className="text-xs">
                    {TYPE_LABELS[post.type] ?? post.type}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {AREA_LABELS[post.area] ?? post.area}
                  </Badge>
                </div>
                <p className="text-sm font-medium">{post.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {post.content}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(post.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function TemplatesList() {
  const { data: templates } = await listTemplates({ limit: 15 });

  if (templates.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center">
        Nenhum template disponível ainda.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {templates.map((t) => (
        <Card key={t.id} className="hover:border-primary/30 transition-colors">
          <CardContent className="py-3 px-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{t.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{t.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {AREA_LABELS[t.area] ?? t.area}
                  </Badge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Download className="h-3 w-3" />
                    {t.downloads}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function CommunityPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Comunidade</h1>
            <p className="text-muted-foreground text-sm">
              Artigos, dúvidas e modelos de advogados
            </p>
          </div>
        </div>
        <Link href="/community/posts/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Publicar
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="posts">
        <TabsList>
          <TabsTrigger value="posts">Feed</TabsTrigger>
          <TabsTrigger value="templates">Modelos</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4">
          <Suspense fallback={<div className="h-32 animate-pulse rounded-md bg-muted" />}>
            <PostsList />
          </Suspense>
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <Suspense fallback={<div className="h-32 animate-pulse rounded-md bg-muted" />}>
            <TemplatesList />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

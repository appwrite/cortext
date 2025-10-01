import { createFileRoute, Link } from '@tanstack/react-router'
import { useAuth } from '@/hooks/use-auth'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { db } from '@/lib/appwrite/db'
import type { Articles } from '@/lib/appwrite/appwrite.types'
import { type Models } from 'appwrite'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { ArrowLeft, LogOut, Brain, Loader2, Pin as PinIcon } from 'lucide-react'

export const Route = createFileRoute('/_protected/dashboard/$articleId-new')({
  component: RouteComponent,
})

function RouteComponent() {
  const params = Route.useParams()
  const { user, signOut } = useAuth()
  const userId = user?.$id

  if (!userId) return <div className="p-6">Loading...</div>

  return (
    <div className="min-h-dvh flex flex-col">
      <Header onSignOut={() => signOut.mutate()} />
      <ArticleEditor articleId={params.articleId} userId={userId} />
    </div>
  )
}

function Header({ onSignOut }: { onSignOut: () => void }) {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="font-semibold tracking-tight inline-flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Cortext
          </Link>
          <nav className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/dashboard" className="hover:underline">Dashboard</Link>
            <span>/</span>
            <span>Editor</span>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onSignOut} className="cursor-pointer">
            <LogOut className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only sm:ml-1">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  )
}

function ArticleEditor({ articleId, userId }: { articleId: string; userId: string }) {
  const qc = useQueryClient()

  const { data: article, isPending } = useQuery({
    queryKey: ['article', articleId],
    queryFn: () => db.articles.get(articleId),
  })

  const updateArticle = useMutation({
    mutationFn: async (data: Partial<Omit<Articles, keyof Models.Document>>) => {
      return db.articles.update(articleId, data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['article', articleId] })
      qc.invalidateQueries({ queryKey: ['articles', userId] })
    },
    onError: () => toast({ title: 'Failed to save article' }),
  })

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!article) {
    return <div>Article not found</div>
  }

  return (
    <main className="flex-1">
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="cursor-pointer">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to articles
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateArticle.mutate({ live: !article.live })}
              className="cursor-pointer"
            >
              {article.live ? 'Unpublish' : 'Publish'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateArticle.mutate({ pinned: !article.pinned })}
              className="cursor-pointer"
            >
              <PinIcon className="h-4 w-4 mr-1" />
              {article.pinned ? 'Unpin' : 'Pin'}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="article-title">Title</Label>
              <Input
                id="article-title"
                value={article.title || ''}
                onChange={(e) => updateArticle.mutate({ title: e.target.value })}
                placeholder="Article title"
                className="text-lg font-semibold"
              />
            </div>
            <div>
              <Label htmlFor="article-subtitle">Subtitle</Label>
              <Input
                id="article-subtitle"
                value={article.subtitle || ''}
                onChange={(e) => updateArticle.mutate({ subtitle: e.target.value })}
                placeholder="Article subtitle"
              />
            </div>
            <div>
              <Label htmlFor="article-trailer">Trailer</Label>
              <Input
                id="article-trailer"
                value={article.trailer || ''}
                onChange={(e) => updateArticle.mutate({ trailer: e.target.value })}
                placeholder="Article trailer text"
              />
            </div>
            <div>
              <Label htmlFor="article-status">Status</Label>
              <select
                id="article-status"
                value={article.status || 'unpublished'}
                onChange={(e) => updateArticle.mutate({ status: e.target.value })}
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
              >
                <option value="unpublished">Unpublished</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <div>
              <Label htmlFor="article-body">Body</Label>
              <Textarea
                id="article-body"
                value={article.body || ''}
                onChange={(e) => updateArticle.mutate({ body: e.target.value })}
                placeholder="Article content"
                rows={15}
              />
            </div>
            <div>
              <Label htmlFor="article-redirect">Redirect URL</Label>
              <Input
                id="article-redirect"
                value={article.redirect || ''}
                onChange={(e) => updateArticle.mutate({ redirect: e.target.value })}
                placeholder="Redirect URL (optional)"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

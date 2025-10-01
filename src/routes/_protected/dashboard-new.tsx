import { createFileRoute, Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useAuth } from '@/hooks/use-auth'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { db } from '@/lib/appwrite/db'
import type { Articles } from '@/lib/appwrite/appwrite.types'
import { Query, type Models } from 'appwrite'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { ArrowLeft, LogOut, Brain, Loader2, Pin as PinIcon, Plus } from 'lucide-react'

export const Route = createFileRoute('/_protected/dashboard-new')({
    component: RouteComponent,
})

function RouteComponent() {
    const { user, signOut } = useAuth()
    const userId = user?.$id

    if (!userId) {
        return <div className="p-6">Loading...</div>
    }

    return (
        <div className="h-dvh overflow-y-auto overscroll-none flex flex-col">
            <Header onSignOut={() => signOut.mutate()} />
            <Dashboard userId={userId} />
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
                        <span>Dashboard</span>
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

function Dashboard({ userId }: { userId: string }) {
    const search = useSearch({ strict: false }) as { articleId?: string; new?: string | number | boolean }
    const navigate = useNavigate()
    const editingId = search?.articleId || null
    const creating = Boolean(search?.new)

    if (editingId) {
        return (
            <main className="flex-1">
                <div className="px-6 py-6">
                    <ArticleEditor key={editingId} articleId={editingId} userId={userId} onBack={() => navigate({ to: '/dashboard', search: {} })} />
                </div>
            </main>
        )
    }

    if (creating) {
        return <CreateArticleView userId={userId} onDone={(id) => navigate({ to: '/dashboard', search: { articleId: id } })} onCancel={() => navigate({ to: '/dashboard', search: {} })} />
    }

    return <ArticlesList userId={userId} />
}

function ArticlesList({ userId }: { userId: string }) {
    const qc = useQueryClient()

    const { data: articleList, isPending: loadingArticles } = useQuery({
        queryKey: ['articles', userId],
        queryFn: async () => {
            const res = await db.articles.list([
                Query.orderDesc('$updatedAt'),
            ])
            return res
        },
    })

    const togglePin = useMutation({
        mutationFn: async ({ id, next }: { id: string; next: boolean }) => {
            return db.articles.update(id, { pinned: next })
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['articles', userId] })
        },
        onError: () => toast({ title: 'Failed to update pin' }),
    })

    const [query, setQuery] = useState('')
    const all = articleList?.documents ?? []
    const filtered = query
        ? all.filter((a) => (a.title || 'Untitled').toLowerCase().includes(query.toLowerCase()))
        : all

    const pinned = filtered.filter((a) => a.pinned)
    const others = filtered.filter((a) => !a.pinned)

    const ColGroup = () => (
        <colgroup>
            <col className="w-[55%]" />
            <col className="hidden sm:table-column w-[20%]" />
            <col className="hidden md:table-column w-[10%]" />
            <col className="w-[15%]" />
        </colgroup>
    )

    const ArticlesTable = ({ rows }: { rows: Articles[] }) => (
        <div className="rounded-md border overflow-hidden">
            <Table className="table-fixed">
                <ColGroup />
                <TableHeader>
                    <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead className="hidden sm:table-cell">Status</TableHead>
                        <TableHead className="hidden md:table-cell">Pinned</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((article) => (
                        <TableRow key={article.$id}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    {article.pinned && <PinIcon className="h-4 w-4 text-yellow-500" />}
                                    <span className="truncate">{article.title || 'Untitled'}</span>
                                </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                    article.status === 'published' ? 'bg-green-100 text-green-800' :
                                    article.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                    {article.status || 'unpublished'}
                                </span>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => togglePin.mutate({ id: article.$id, next: !article.pinned })}
                                    className="cursor-pointer"
                                >
                                    <PinIcon className={`h-4 w-4 ${article.pinned ? 'text-yellow-500' : 'text-gray-400'}`} />
                                </Button>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate({ to: '/dashboard', search: { articleId: article.$id } })}
                                    className="cursor-pointer"
                                >
                                    Edit
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )

    if (loadingArticles) {
        return (
            <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        )
    }

    return (
        <main className="flex-1">
            <div className="px-6 py-6 space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Articles</h1>
                    <Button
                        onClick={() => navigate({ to: '/dashboard', search: { new: true } })}
                        className="cursor-pointer"
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        New Article
                    </Button>
                </div>

                <div className="space-y-4">
                    <Input
                        placeholder="Search articles..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="max-w-sm"
                    />

                    {pinned.length > 0 && (
                        <div className="space-y-2">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <PinIcon className="h-5 w-5 text-yellow-500" />
                                Pinned Articles
                            </h2>
                            <ArticlesTable rows={pinned} />
                        </div>
                    )}

                    {others.length > 0 && (
                        <div className="space-y-2">
                            <h2 className="text-lg font-semibold">All Articles</h2>
                            <ArticlesTable rows={others} />
                        </div>
                    )}

                    {filtered.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            {query ? 'No articles found matching your search.' : 'No articles yet. Create your first article!'}
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
}

function CreateArticleView({ userId, onDone, onCancel }: { userId: string; onDone: (id: string) => void; onCancel: () => void }) {
    const qc = useQueryClient()
    const [title, setTitle] = useState('')
    const createArticle = useMutation({
        mutationFn: async () => {
            const payload: Omit<Articles, keyof Models.Document> = {
                trailer: null,
                title: title.trim() || 'Untitled',
                status: 'unpublished',
                subtitle: null,
                images: null,
                body: null,
                authors: null,
                live: false,
                pinned: false,
                redirect: null,
                categories: null,
            }
            return db.articles.create(payload)
        },
        onSuccess: (doc) => {
            qc.invalidateQueries({ queryKey: ['articles', userId] })
            toast({ title: 'Article created' })
            onDone(doc.$id)
        },
    })

    return (
        <main className="flex-1">
            <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={onCancel} className="cursor-pointer">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Back to articles
                    </Button>
                </div>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="new-title">Title</Label>
                        <Input id="new-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Article title" />
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => createArticle.mutate()} disabled={createArticle.isPending} className="cursor-pointer">
                            <Plus className="h-4 w-4 mr-1" /> {createArticle.isPending ? 'Creating…' : 'Create'}
                        </Button>
                    </div>
                </div>
            </div>
        </main>
    )
}

function ArticleEditor({ articleId, userId, onBack }: { articleId: string; userId: string; onBack: () => void }) {
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
                    <Button variant="ghost" size="sm" onClick={onBack} className="cursor-pointer">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Back to articles
                    </Button>
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
                                rows={10}
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

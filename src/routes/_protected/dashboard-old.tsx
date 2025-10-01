import { createFileRoute, Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useAuth } from '@/hooks/use-auth'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { db } from '@/lib/appwrite/db'
import { files } from '@/lib/appwrite/storage'
import type { Articles } from '@/lib/appwrite/appwrite.types'
import { Query, type Models } from 'appwrite'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { Image as ImageIcon, Plus, Trash2, Save, Video, MapPin, Type as TypeIcon, Upload, ArrowLeft, LogOut, GripVertical, Brain, Loader2, Heading1, Quote, Pin as PinIcon } from 'lucide-react'
import { AgentChat } from '@/components/agent/agent-chat'

export const Route = createFileRoute('/_protected/dashboard-old')({
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
                Query.equal('createdBy', [userId]),
                Query.orderDesc('$updatedAt'),
            ])
            return res
        },
    })

    const togglePin = useMutation({
        mutationFn: async ({ id, next }: { id: string; next: boolean }) => {
            const current = await db.articles.get(id)
            if (current.createdBy !== userId) throw new Error('Forbidden')
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
                        <TableHead className="hidden sm:table-cell">Updated</TableHead>
                        <TableHead className="hidden md:table-cell">Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((a) => (
                        <TableRow key={a.$id}>
                            <TableCell className="max-w-[420px] truncate">
                                <Link to="/dashboard" search={{ articleId: a.$id }} className="hover:underline">
                                    {a.title || 'Untitled'}
                                </Link>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-muted-foreground">
                                {new Date(a.$updatedAt).toLocaleString()}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                                {a.published ? (
                                    <span className="text-green-600">Published</span>
                                ) : (
                                    <span className="text-amber-600">Draft</span>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center gap-1 justify-end">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="cursor-pointer"
                                        onClick={() => togglePin.mutate({ id: a.$id, next: !a.pinned })}
                                        title={a.pinned ? 'Unpin' : 'Pin'}
                                    >
                                        <PinIcon className={`h-4 w-4 mr-1 ${a.pinned ? 'text-primary' : ''}`} /> {a.pinned ? 'Unpin' : 'Pin'}
                                    </Button>
                                    <Link to="/dashboard" search={{ articleId: a.$id }}>
                                        <Button variant="ghost" size="sm" className="cursor-pointer">Edit</Button>
                                    </Link>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )

    return (
        <main className="flex-1">
            <div className="px-6 py-6 space-y-6">
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">Your Articles</h1>
                        <p className="text-sm text-muted-foreground">Create, select, and manage your articles.</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                        <Link to="/dashboard" search={{ new: 1 }}>
                            <Button size="sm" variant="outline" className="cursor-pointer">
                                <Plus className="h-4 w-4 mr-1" /> New Article
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search articles..."
                        className="h-9 max-w-md"
                        aria-label="Search articles"
                    />
                </div>

                {loadingArticles ? (
                    <div className="text-sm text-muted-foreground">Loading…</div>
                ) : all.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No articles yet. Create your first one.</p>
                ) : (
                    <div className="space-y-6">
                        {pinned.length > 0 && (
                            <section className="space-y-2">
                                <h2 className="text-sm font-medium tracking-tight">Pinned</h2>
                                <ArticlesTable rows={pinned as Articles[]} />
                            </section>
                        )}

                        <section className="space-y-2">
                            <h2 className="text-sm font-medium tracking-tight">All articles</h2>
                            {others.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No matching articles.</p>
                            ) : (
                                <ArticlesTable rows={others as Articles[]} />
                            )}
                        </section>
                    </div>
                )}
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

    const { data: sectionsData } = useQuery({
        queryKey: ['articleSections', articleId],
        queryFn: async () => {
            const res = await db.articleSections.list([
                Query.equal('createdBy', [userId]),
                Query.equal('articleId', [articleId]),
                Query.orderAsc('position'),
            ])
            return res.documents
        },
    })

    const [localSections, setLocalSections] = useState<ArticleSections[]>([])

    useEffect(() => {
        if (sectionsData) {
            setLocalSections(sectionsData.map((s) => ({ ...s })))
        }
    }, [sectionsData])

    // Track a newly created section to focus its first relevant input when it renders
    const focusTargetRef = useRef<{ id: string; type: string } | null>(null)

    const updateArticle = useMutation({
        mutationFn: async (data: Partial<Omit<Articles, keyof Models.Document>>) => {
            const current = await db.articles.get(articleId)
            if (current.createdBy !== userId) throw new Error('Forbidden')
            return db.articles.update(articleId, sanitizeArticleUpdate(data))
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['article', articleId] })
            qc.invalidateQueries({ queryKey: ['articles', userId] })
        },
        onError: () => toast({ title: 'Failed to save article' }),
    })

    const createSection = useMutation({
        mutationFn: async (type: string) => {
            const payload: Omit<ArticleSections, keyof Models.Document> = {
                createdBy: userId,
                articleId,
                type,
                position: (localSections?.length ?? 0),
                content: null,
                mediaId: null,
                embedUrl: null,
                data: null,
                caption: null,
                speaker: null,
            }
            return db.articleSections.create(payload)
        },
        onSuccess: (doc, type) => {
            // after the list re-fetches and renders, focus the first input
            focusTargetRef.current = { id: doc.$id, type: String(type) }
            qc.invalidateQueries({ queryKey: ['articleSections', articleId] })
        },
    })

    const updateSection = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: Partial<Omit<ArticleSections, keyof Models.Document>> }) => {
            const current = await db.articleSections.get(id)
            if (current.createdBy !== userId) throw new Error('Forbidden')
            return db.articleSections.update(id, sanitizeSectionUpdate(data))
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['articleSections', articleId] }),
    })

    const deleteSection = useMutation({
        mutationFn: async (id: string) => {
            const current = await db.articleSections.get(id)
            if (current.createdBy !== userId) throw new Error('Forbidden')
            return db.articleSections.delete(id)
        },
        onSuccess: () => {
            setLocalSections((prev) => prev.filter((s) => s.$id !== idToDeleteRef.current))
            qc.invalidateQueries({ queryKey: ['articleSections', articleId] })
        },
    })

    const idToDeleteRef = useRef<string | null>(null)

    // Focus newly added section's primary input once it appears in the DOM
    useEffect(() => {
        const target = focusTargetRef.current
        if (!target) return
        const inputId = firstInputIdFor(target.type, target.id)
        // try immediately and on next frame for safety
        const tryFocus = () => {
            const el = document.getElementById(inputId) as HTMLInputElement | HTMLTextAreaElement | null
            if (el) {
                el.focus()
                if ('selectionStart' in el && typeof (el as any).value === 'string') {
                    const val = (el as any).value as string
                    ;(el as any).setSelectionRange?.(val.length, val.length)
                }
                focusTargetRef.current = null
                return true
            }
            return false
        }
        if (!tryFocus()) {
            requestAnimationFrame(() => {
                tryFocus()
            })
        }
    }, [localSections])

    // Drag & drop ordering with clear cues
    const dragIdRef = useRef<string | null>(null)
    const [draggingId, setDraggingId] = useState<string | null>(null)
    const [overInfo, setOverInfo] = useState<{ id: string | null; where: 'above' | 'below' }>({ id: null, where: 'below' })

    const onDragStart = (id: string, e: React.DragEvent) => {
        dragIdRef.current = id
        setDraggingId(id)
        e.dataTransfer.effectAllowed = 'move'
        try { e.dataTransfer.setData('text/plain', id) } catch { }
    }

    const onDragOverRow = (id: string, e: React.DragEvent) => {
        e.preventDefault()
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        const where = e.clientY < rect.top + rect.height / 2 ? 'above' : 'below'
        setOverInfo({ id, where })
        e.dataTransfer.dropEffect = 'move'
    }

    const persistOrder = async (next: ArticleSections[]) => {
        const changes = next
            .map((s, i) => ({ id: s.$id, position: i, prev: s.position }))
            .filter((s) => s.position !== s.prev)
        if (!changes.length) return
        await Promise.all(
            changes.map((c) => updateSection.mutateAsync({ id: c.id, data: { position: c.position } }))
        )
    }

    const onDropRow = async (targetId: string, e: React.DragEvent) => {
        e.preventDefault()
        const sourceId = dragIdRef.current || (() => {
            try { return e.dataTransfer.getData('text/plain') } catch { return null }
        })()
        dragIdRef.current = null
        setDraggingId(null)
        const currentOver = overInfo
        setOverInfo({ id: null, where: 'below' })
        if (!sourceId || sourceId === targetId) return

        setLocalSections((prev) => {
            const src = prev.findIndex((s) => s.$id === sourceId)
            const tgt = prev.findIndex((s) => s.$id === targetId)
            if (src < 0 || tgt < 0) return prev
            const next = [...prev]
            const [moved] = next.splice(src, 1)
            // Compute actual insertion index based on above/below
            let insertIndex = tgt
            if (currentOver.id === targetId && currentOver.where === 'below') insertIndex = tgt + 1
            if (src < insertIndex) insertIndex -= 1 // account for removal shift
            next.splice(insertIndex, 0, moved)
            const normalized = next.map((s, i) => ({ ...s, position: i }))
            persistOrder(normalized)
            return normalized
        })
    }

    const [title, setTitle] = useState('')
    const [excerpt, setExcerpt] = useState('')
    const [saving, setSaving] = useState(false)

    useMemo(() => {
        if (article) {
            setTitle(article.title ?? '')
            setExcerpt(article.excerpt ?? '')
        }
    }, [article])

    const handleMainSave = async () => {
        try {
            setSaving(true)
            // 1) Save article meta
            await updateArticle.mutateAsync({ title, slug: slugify(title), excerpt })

            // 2) Save changed sections in batch
            const originals = sectionsData || []
            const changed = localSections.filter((loc) => {
                const orig = originals.find((o) => o.$id === loc.$id)
                if (!orig) return false
                return hasSectionChanged(loc, orig)
            })

            if (changed.length) {
                await Promise.all(
                    changed.map((s) =>
                        updateSection.mutateAsync({
                            id: s.$id,
                            data: {
                                type: s.type,
                                content: s.content ?? null,
                                mediaId: s.mediaId ?? null,
                                embedUrl: s.embedUrl ?? null,
                                data: s.data ?? null,
                                caption: s.caption ?? null,
                                position: s.position,
                                speaker: s.speaker ?? null,
                            },
                        })
                    )
                )
            }

            toast({ title: 'Saved' })
            // Refresh queries
            const qc = useQueryClient()
            qc.invalidateQueries({ queryKey: ['articleSections', articleId] })
            qc.invalidateQueries({ queryKey: ['article', articleId] })
        } catch (e) {
            toast({ title: 'Failed to save changes' })
        } finally {
            setSaving(false)
        }
    }

    if (isPending || !article) {
        return <div className="text-sm text-muted-foreground">Loading…</div>
    }

    return (
        <>
            <AgentChat title={title} excerpt={excerpt} onSetTitle={setTitle} onSetExcerpt={setExcerpt} />
            <div className="pb-16 pl-72 md:pl-80 lg:pl-96 pr-4 sm:pr-6 space-y-6">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={onBack} className="cursor-pointer">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Back to articles
                    </Button>
                </div>

                {/* Article meta form */}
                <section className="space-y-4">
                    <div className="md:col-span-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Article title" />
                    </div>
                    <div>
                        <Label htmlFor="excerpt">Excerpt</Label>
                        <Input id="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Short summary (optional)" />
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>Status:</span>
                        {article.published ? <span className="text-green-600">Published</span> : <span className="text-amber-600">Draft</span>}
                        {article.publishedAt && <span>• {new Date(article.publishedAt).toLocaleString()}</span>}
                    </div>
                </section>

                {/* Sections composer */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-medium">Sections</h2>
                        <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => createSection.mutate('title')} className="cursor-pointer h-7 px-2 text-xs"><Heading1 className="h-3.5 w-3.5 mr-1" /> Title</Button>
                            <Button size="sm" variant="outline" onClick={() => createSection.mutate('text')} className="cursor-pointer h-7 px-2 text-xs"><TypeIcon className="h-3.5 w-3.5 mr-1" /> Text</Button>
                            <Button size="sm" variant="outline" onClick={() => createSection.mutate('quote')} className="cursor-pointer h-7 px-2 text-xs"><Quote className="h-3.5 w-3.5 mr-1" /> Quote</Button>
                            <Button size="sm" variant="outline" onClick={() => createSection.mutate('image')} className="cursor-pointer h-7 px-2 text-xs"><ImageIcon className="h-3.5 w-3.5 mr-1" /> Image</Button>
                            <Button size="sm" variant="outline" onClick={() => createSection.mutate('video')} className="cursor-pointer h-7 px-2 text-xs"><Video className="h-3.5 w-3.5 mr-1" /> Video</Button>
                            <Button size="sm" variant="outline" onClick={() => createSection.mutate('map')} className="cursor-pointer h-7 px-2 text-xs"><MapPin className="h-3.5 w-3.5 mr-1" /> Map</Button>
                        </div>
                    </div>

                    {(localSections?.length ?? 0) === 0 ? (
                        <p className="text-sm text-muted-foreground">No sections yet. Add one above.</p>
                    ) : (
                        <div className="rounded-md border overflow-hidden">
                            <Table className="[&_td]:align-top">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">Order</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Content</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {localSections?.map((s) => {
                                        const isTarget = overInfo.id === s.$id && (!!draggingId && draggingId !== s.$id)
                                        const borderCue = isTarget ? (overInfo.where === 'above' ? 'border-t-2 border-primary' : 'border-b-2 border-primary') : ''
                                        return (
                                            <TableRow
                                                key={s.$id}
                                                onDragOver={(e) => onDragOverRow(s.$id, e)}
                                                onDrop={(e) => onDropRow(s.$id, e)}
                                                className={`relative transition-colors ${isTarget ? 'bg-accent/50' : ''} ${borderCue}`}
                                            >
                                                <TableCell>
                                                    <button
                                                        aria-label="Drag to reorder"
                                                        draggable
                                                        onDragStart={(e) => onDragStart(s.$id, e)}
                                                        onDragEnd={() => { setDraggingId(null); setOverInfo({ id: null, where: 'below' }) }}
                                                        className={`p-1 rounded hover:bg-accent text-muted-foreground cursor-grab active:cursor-grabbing ${draggingId === s.$id ? 'opacity-60 ring-2 ring-primary/40' : ''}`}
                                                        title="Drag to reorder"
                                                    >
                                                        <GripVertical className="h-4 w-4" />
                                                    </button>
                                                </TableCell>
                                                <TableCell className="capitalize">{s.type}</TableCell>
                                                <TableCell>
                                                    <SectionEditor
                                                        section={s}
                                                        onLocalChange={(patch) => setLocalSections((prev) => prev.map((it) => it.$id === s.$id ? { ...it, ...patch } as ArticleSections : it))}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => { idToDeleteRef.current = s.$id; deleteSection.mutate(s.$id) }} className="cursor-pointer">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </section>

                {/* Sticky bottom actions — stop before agent rail */}
                <div className="fixed bottom-0 right-0 left-72 md:left-80 lg:left-96 z-20 border-t bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
                    <div className="px-6 py-3 flex items-center justify-end gap-2">
                        <Button
                            variant="secondary"
                            className="whitespace-nowrap cursor-pointer"
                            onClick={() => updateArticle.mutate({ published: !article.published, publishedAt: !article.published ? Date.now() : null })}
                        >
                            {article.published ? 'Unpublish' : 'Publish'}
                        </Button>
                        <Button onClick={handleMainSave} disabled={saving} className="cursor-pointer">
                            {saving ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4 mr-1" />
                            )}
                            Save
                        </Button>
                    </div>
                </div>
            </div>
        </>
    )
}

function SectionEditor({ section, onLocalChange }: { section: ArticleSections; onLocalChange: (data: Partial<ArticleSections>) => void }) {
    if (section.type === 'title') {
        return <TitleEditor section={section} onLocalChange={onLocalChange} />
    }
    if (section.type === 'quote') {
        return <QuoteEditor section={section} onLocalChange={onLocalChange} />
    }
    if (section.type === 'text' || section.type === 'paragraph') {
        return <TextEditor section={section} onLocalChange={onLocalChange} />
    }
    if (section.type === 'image') {
        return <ImageEditor section={section} onLocalChange={onLocalChange} />
    }
    if (section.type === 'video') {
        return <VideoEditor section={section} onLocalChange={onLocalChange} />
    }
    if (section.type === 'map') {
        return <MapEditor section={section} onLocalChange={onLocalChange} />
    }
    return <span className="text-sm text-muted-foreground">Unsupported section</span>
}

function TitleEditor({ section, onLocalChange }: { section: ArticleSections; onLocalChange: (data: Partial<ArticleSections>) => void }) {
    const [value, setValue] = useState(section.content ?? '')

    useEffect(() => {
        onLocalChange({ content: value, type: 'title' })
    }, [value])

    return (
        <div className="space-y-1">
            <Label htmlFor={`title-${section.$id}`}>Title</Label>
            <Input
                id={`title-${section.$id}`}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Section title"
            />
        </div>
    )
}

function QuoteEditor({ section, onLocalChange }: { section: ArticleSections; onLocalChange: (data: Partial<ArticleSections>) => void }) {
    const [quote, setQuote] = useState(section.content ?? '')
    const [speaker, setSpeaker] = useState(section.speaker ?? '')

    useEffect(() => {
        onLocalChange({ content: quote, speaker, type: 'quote' })
    }, [quote, speaker])

    return (
        <div className="space-y-2">
            <div className="space-y-1">
                <Label htmlFor={`quote-${section.$id}`}>Quote</Label>
                <Textarea id={`quote-${section.$id}`} value={quote} onChange={(e) => setQuote(e.target.value)} placeholder="Add a memorable line…" rows={2} />
            </div>
            <div className="space-y-1">
                <Label htmlFor={`speaker-${section.$id}`}>Speaker</Label>
                <Input id={`speaker-${section.$id}`} value={speaker} onChange={(e) => setSpeaker(e.target.value)} placeholder="Who said it?" />
            </div>
        </div>
    )
}

function TextEditor({ section, onLocalChange }: { section: ArticleSections; onLocalChange: (data: Partial<ArticleSections>) => void }) {
    const [value, setValue] = useState(section.content ?? '')
    const ref = useRef<HTMLTextAreaElement | null>(null)

    useEffect(() => {
        if (!ref.current) return
        ref.current.style.height = 'auto'
        ref.current.style.height = ref.current.scrollHeight + 'px'
    }, [value])

    useEffect(() => {
        onLocalChange({ content: value, type: 'text' })
    }, [value])

    return (
        <div className="space-y-1">
            <Label htmlFor={`text-${section.$id}`}>Text</Label>
            <Textarea
                id={`text-${section.$id}`}
                ref={ref}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Write text…"
                rows={1}
                className="min-h-[40px] text-sm"
                style={{ overflow: 'hidden', resize: 'none' }}
            />
        </div>
    )
}

function ImageEditor({ section, onLocalChange }: { section: ArticleSections; onLocalChange: (data: Partial<ArticleSections>) => void }) {
    const [uploading, setUploading] = useState(false)
    const [dragOver, setDragOver] = useState(false)
    const previewUrl = section.mediaId ? String(files.getPreview(section.mediaId, 480, 0)) : null

    const handleFile = async (file?: File) => {
        if (!file) return
        setUploading(true)
        try {
            const res = await files.upload(file, file.name)
            onLocalChange({ mediaId: res.$id })
        } catch (e) {
            toast({ title: 'Upload failed' })
        } finally {
            setUploading(false)
        }
    }

    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setDragOver(false)
        const file = e.dataTransfer.files?.[0]
        if (file) handleFile(file)
    }

    return (
        <div className="space-y-2">
            <div className="space-y-1">
                <Label htmlFor={`file-${section.$id}`}>Image</Label>
                <div className="flex items-start gap-3">
                    {previewUrl && (
                        <img src={previewUrl} alt="" className="max-h-32 rounded border" />
                    )}
                    <div className="flex-1">
                        <div
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={onDrop}
                            className={`relative rounded-md border border-dashed h-24 flex items-center justify-center text-xs text-muted-foreground cursor-pointer ${dragOver ? 'bg-accent/40' : 'bg-transparent'}`}
                            onClick={() => (document.getElementById(`file-${section.$id}`) as HTMLInputElement | null)?.click()}
                            role="button"
                            aria-label="Upload image"
                        >
                            {uploading ? 'Uploading…' : 'Drag & drop image or click to upload'}
                            <input
                                id={`file-${section.$id}`}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFile(e.target.files?.[0] || undefined)}
                            />
                        </div>
                        {section.mediaId && (
                            <div className="mt-2">
                                <Button size="sm" variant="secondary" onClick={() => onLocalChange({ mediaId: null })} className="cursor-pointer">Remove</Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="space-y-1">
                <Label htmlFor={`caption-${section.$id}`}>Caption</Label>
                <Input id={`caption-${section.$id}`} value={section.caption ?? ''} onChange={(e) => onLocalChange({ caption: e.target.value })} placeholder="Caption (optional)" />
            </div>
        </div>
    )
}

function VideoEditor({ section, onLocalChange }: { section: ArticleSections; onLocalChange: (data: Partial<ArticleSections>) => void }) {
    const [url, setUrl] = useState(section.embedUrl ?? '')
    const embed = toYouTubeEmbed(url)

    useEffect(() => {
        onLocalChange({ embedUrl: url })
    }, [url])

    return (
        <div className="space-y-2">
            <div className="space-y-1">
                <Label htmlFor={`video-url-${section.$id}`}>Video URL</Label>
                <Input id={`video-url-${section.$id}`} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste YouTube URL" />
            </div>
            {embed && (
                <div className="aspect-video w-full max-w-md">
                    <iframe className="w-full h-full rounded border" src={embed} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="YouTube preview" />
                </div>
            )}
            <div className="space-y-1">
                <Label htmlFor={`caption-${section.$id}`}>Caption</Label>
                <Input id={`caption-${section.$id}`} value={section.caption ?? ''} onChange={(e) => onLocalChange({ caption: e.target.value })} placeholder="Caption (optional)" />
            </div>
        </div>
    )
}

function MapEditor({ section, onLocalChange }: { section: ArticleSections; onLocalChange: (data: Partial<ArticleSections>) => void }) {
    const initial = parseLatLng(section.data)
    const [lat, setLat] = useState<string | number>(initial?.lat ?? '')
    const [lng, setLng] = useState<string | number>(initial?.lng ?? '')
    const nlat = typeof lat === 'number' ? lat : parseFloat(lat)
    const nlng = typeof lng === 'number' ? lng : parseFloat(lng)
    const iframe = toOSMEmbed(nlat, nlng)

    useEffect(() => {
        if (!Number.isNaN(nlat) && !Number.isNaN(nlng)) {
            onLocalChange({ data: JSON.stringify({ lat: Number(nlat), lng: Number(nlng) }) })
        }
    }, [lat, lng])

    return (
        <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 items-start">
                <div className="space-y-1">
                    <Label htmlFor={`lat-${section.$id}`}>Latitude</Label>
                    <Input id={`lat-${section.$id}`} placeholder="e.g. 37.7749" value={lat as any} onChange={(e) => setLat(e.target.value as any)} />
                </div>
                <div className="space-y-1">
                    <Label htmlFor={`lng-${section.$id}`}>Longitude</Label>
                    <Input id={`lng-${section.$id}`} placeholder="e.g. -122.4194" value={lng as any} onChange={(e) => setLng(e.target.value as any)} />
                </div>
            </div>
            {nlat && nlng ? (
                <div className="w-full max-w-md h-44">
                    <iframe className="w-full h-full rounded border" src={iframe} title="Map preview" />
                </div>
            ) : (
                <p className="text-xs text-muted-foreground">Enter coordinates to preview</p>
            )}
        </div>
    )
}

function hasSectionChanged(a: ArticleSections, b: ArticleSections) {
    return (
        a.type !== b.type ||
        (a.content ?? null) !== (b.content ?? null) ||
        (a.mediaId ?? null) !== (b.mediaId ?? null) ||
        (a.embedUrl ?? null) !== (b.embedUrl ?? null) ||
        (a.data ?? null) !== (b.data ?? null) ||
        (a.caption ?? null) !== (b.caption ?? null) ||
        (a.speaker ?? null) !== (b.speaker ?? null) ||
        a.position !== b.position
    )
}

function slugify(input: string) {
    return input
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
}

function sanitizeArticleUpdate(data: Partial<Omit<Articles, keyof Models.Document>>) {
    const { createdBy, ...rest } = data as any
    return rest
}

function sanitizeSectionUpdate(data: Partial<Omit<ArticleSections, keyof Models.Document>>) {
    const { createdBy, articleId, ...rest } = data as any
    return rest
}

function toYouTubeEmbed(url: string | null | undefined) {
    if (!url) return null
    try {
        const u = new URL(url)
        if (u.hostname.includes('youtu.be')) {
            const id = u.pathname.split('/')[1]
            return `https://www.youtube.com/embed/${id}`
        }
        if (u.hostname.includes('youtube.com')) {
            const id = u.searchParams.get('v')
            if (id) return `https://www.youtube.com/embed/${id}`
        }
    } catch { }
    return null
}

function parseLatLng(json: string | null) {
    try {
        return json ? JSON.parse(json) as { lat: number; lng: number } : null
    } catch {
        return null
    }
}

function toOSMEmbed(lat?: number, lng?: number) {
    if (!lat || !lng) return ''
    const d = 0.005
    const left = lng - d
    const right = lng + d
    const top = lat + d
    const bottom = lat - d
    const bbox = `${left}%2C${bottom}%2C${right}%2C${top}`
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`
}

function firstInputIdFor(type: string, id: string) {
    switch (type) {
        case 'title':
            return `title-${id}`
        case 'quote':
            return `quote-${id}`
        case 'text':
        case 'paragraph':
            return `text-${id}`
        case 'video':
            return `video-url-${id}`
        case 'map':
            return `lat-${id}`
        case 'image':
            // file input is hidden; focus caption for best UX
            return `caption-${id}`
        default:
            return `text-${id}`
    }
}

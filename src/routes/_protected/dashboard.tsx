import { createFileRoute, Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useAuth } from '@/hooks/use-auth'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from '@/hooks/use-toast'
import { Image as ImageIcon, Plus, Trash2, Save, Video, MapPin, Type as TypeIcon, Upload, ArrowLeft, LogOut, GripVertical, Brain, Loader2, Heading1, Quote, Pin as PinIcon, FileText, Quote as QuoteIcon, Code } from 'lucide-react'
import { AgentChat } from '@/components/agent/agent-chat'
import { AuthorSelector } from '@/components/author'
import { CategorySelector } from '@/components/category'
import { ImageGallery } from '@/components/image'
import { NotificationBell } from '@/components/notification'
import { NotificationTest } from '@/components/notification/notification-test'
import { CodeEditor } from '@/components/ui/code-editor'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { formatDateForDisplay, formatDateCompact } from '@/lib/date-utils'

export const Route = createFileRoute('/_protected/dashboard')({
    component: RouteComponent,
})

// Helper function to get section type icon
function getSectionTypeIcon(type: string) {
    switch (type) {
        case 'title':
            return <Heading1 className="h-4 w-4" />
        case 'text':
        case 'paragraph':
            return <FileText className="h-4 w-4" />
        case 'quote':
            return <QuoteIcon className="h-4 w-4" />
        case 'image':
            return <ImageIcon className="h-4 w-4" />
        case 'video':
            return <Video className="h-4 w-4" />
        case 'map':
            return <MapPin className="h-4 w-4" />
        case 'code':
            return <Code className="h-4 w-4" />
        default:
            return <TypeIcon className="h-4 w-4" />
    }
}

function RouteComponent() {
    const { user, signOut } = useAuth()
    const userId = user?.$id

    // Set document title for dashboard
    useDocumentTitle('Dashboard')

    if (!userId) {
        return <div className="p-6">Loading...</div>
    }

    return (
        <div className="h-dvh overflow-y-auto overscroll-none flex flex-col">
            <Header userId={userId} onSignOut={() => signOut.mutate()} />
            <Dashboard userId={userId} />
        </div>
    )
}

function Header({ userId, onSignOut }: { userId: string; onSignOut: () => void }) {
    return (
        <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
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
                <div className="flex items-center gap-4">
                    <NotificationBell userId={userId} />
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
                                {formatDateCompact(a.$updatedAt)}
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

                <NotificationTest userId={userId} />

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
    const [trailer, setTrailer] = useState('')
    const [title, setTitle] = useState('')
    const [live, setLive] = useState(false)
    const [redirect, setRedirect] = useState('')
    const [authors, setAuthors] = useState<string[]>([])
    const [categories, setCategories] = useState<string[]>([])
    const createArticle = useMutation({
        mutationFn: async () => {
            const payload: Omit<Articles, keyof Models.Document> = {
                trailer: trailer.trim() || null,
                title: title.trim() || 'Untitled',
                status: 'unpublished',
                subtitle: null,
                images: null,
                body: null,
                authors: authors.length > 0 ? authors : null,
                live: live,
                pinned: false,
                redirect: redirect.trim() || null,
                categories: categories.length > 0 ? categories : null,
                createdBy: userId,
                published: false,
                slug: null,
                publishedAt: null,
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
                        <Label htmlFor="new-trailer">Trailer</Label>
                        <Input id="new-trailer" value={trailer} onChange={(e) => setTrailer(e.target.value)} placeholder="Breaking news, Exclusive..." />
                    </div>
                    <div>
                        <Label htmlFor="new-title">Title</Label>
                        <div className="relative">
                            <Input id="new-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Article title" className="pr-32" />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                                <Checkbox id="new-live" checked={live} onCheckedChange={(checked) => setLive(checked === true)} />
                                <Label htmlFor="new-live" className="text-xs text-muted-foreground inline-label">Live</Label>
                            </div>
                        </div>
                    </div>
                    <div>
                        <AuthorSelector 
                            selectedAuthorIds={authors} 
                            onAuthorsChange={setAuthors} 
                        />
                    </div>
                    <div>
                        <CategorySelector 
                            selectedCategoryIds={categories} 
                            onCategoriesChange={setCategories} 
                        />
                    </div>
                    <div>
                        <Label htmlFor="new-redirect">Redirect URL</Label>
                        <Input id="new-redirect" value={redirect} onChange={(e) => setRedirect(e.target.value)} placeholder="Redirect URL (optional)" />
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

    const [localSections, setLocalSections] = useState<any[]>([])

    useEffect(() => {
        if (article?.body) {
            try {
                const sections = JSON.parse(article.body)
                setLocalSections(Array.isArray(sections) ? sections : [])
            } catch {
                setLocalSections([])
            }
        }
    }, [article?.body])

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

    const createSection = (type: string) => {
        const newSection = {
            id: Date.now().toString(),
            type,
            position: (localSections?.length ?? 0),
            content: '',
            title: '',
            speaker: null,
        }
        const updatedSections = [...localSections, newSection]
        setLocalSections(updatedSections)
        // Focus the first input after the component re-renders
        focusTargetRef.current = { id: newSection.id, type: String(type) }
    }

    const updateSection = useCallback((id: string, data: any) => {
        setLocalSections(prev => prev.map(section => 
            section.id === id ? { ...section, ...data } : section
        ))
    }, [])

    // Memoized onLocalChange handler for each section
    const onLocalChangeHandlers = useMemo(() => {
        const handlers: Record<string, (patch: any) => void> = {}
        localSections.forEach(section => {
            handlers[section.id] = (patch: any) => updateSection(section.id, patch)
        })
        return handlers
    }, [localSections, updateSection])

    const deleteSection = (id: string) => {
        setLocalSections(prev => prev.filter(section => section.id !== id))
    }


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

    const onDragOverBottom = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setOverInfo({ id: 'bottom', where: 'below' })
        e.dataTransfer.dropEffect = 'move'
    }

    const persistOrder = (next: any[]) => {
        const updatedSections = next.map((s, i) => ({ ...s, position: i }))
        setLocalSections(updatedSections)
    }

    const onDropRow = (targetId: string, e: React.DragEvent) => {
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
            const src = prev.findIndex((s) => s.id === sourceId)
            if (src < 0) return prev
            
            // Handle bottom drop case
            if (targetId === 'bottom') {
                const next = [...prev]
                const [moved] = next.splice(src, 1)
                next.push(moved) // Add to end
                const normalized = next.map((s, i) => ({ ...s, position: i }))
                persistOrder(normalized)
                return normalized
            }
            
            // Handle normal row drop case
            const tgt = prev.findIndex((s) => s.id === targetId)
            if (tgt < 0) return prev
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

    const [trailer, setTrailer] = useState('')
    const [title, setTitle] = useState('')
    const [subtitle, setExcerpt] = useState('')
    const [live, setLive] = useState(false)
    const [redirect, setRedirect] = useState('')
    const [authors, setAuthors] = useState<string[]>([])
    const [categories, setCategories] = useState<string[]>([])
    const [saving, setSaving] = useState(false)

    useMemo(() => {
        if (article) {
            setTrailer(article.trailer ?? '')
            setTitle(article.title ?? '')
            setExcerpt(article.subtitle ?? '')
            setLive(article.live ?? false)
            setRedirect(article.redirect ?? '')
            setAuthors(article.authors ?? [])
            setCategories(article.categories ?? [])
        }
    }, [article])

    // Set document title based on article title
    useDocumentTitle(title || 'Editor')

    const handleMainSave = async () => {
        try {
            setSaving(true)
            await updateArticle.mutateAsync({ 
                trailer,
                title, 
                slug: slugify(title), 
                subtitle,
                live,
                redirect,
                authors,
                categories,
                body: JSON.stringify(localSections)
            })

            toast({ title: 'Saved' })
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
            <AgentChat title={title} subtitle={subtitle} onSetTitle={setTitle} onSetSubtitle={setExcerpt} />
            <div className="px-6 pt-2 pb-8 ml-0 md:ml-[18rem] lg:ml-[20rem] xl:ml-[24rem]">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={onBack} className="cursor-pointer">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Back to articles
                    </Button>
                </div>
            </div>
            <div className="flex justify-center px-6 py-6 pb-24 ml-0 md:ml-[18rem] lg:ml-[20rem] xl:ml-[24rem]">
                <div className="w-full max-w-3xl space-y-8">

                {/* Article meta form */}
                <section className="space-y-4">
                    <div>
                        <Label htmlFor="trailer">Trailer</Label>
                        <Input id="trailer" value={trailer} onChange={(e) => setTrailer(e.target.value)} placeholder="Breaking news, Exclusive..." />
                    </div>
                    <div className="md:col-span-2">
                        <Label htmlFor="title">Title</Label>
                        <div className="relative">
                            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Article title" className="pr-32" />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                                <Checkbox id="live" checked={live} onCheckedChange={(checked) => setLive(checked === true)} />
                                <Label htmlFor="live" className="text-xs text-muted-foreground inline-label">Live</Label>
                            </div>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="subtitle">Subtitle</Label>
                        <Input id="subtitle" value={subtitle} onChange={(e) => setExcerpt(e.target.value)} placeholder="Short summary (optional)" />
                    </div>
                    <div>
                        <AuthorSelector 
                            selectedAuthorIds={authors} 
                            onAuthorsChange={setAuthors} 
                        />
                    </div>
                    <div>
                        <CategorySelector 
                            selectedCategoryIds={categories} 
                            onCategoriesChange={setCategories} 
                        />
                    </div>
                </section>

                {/* Sections composer */}
                <section className="space-y-4">
                    <div>
                        <h2 className="text-base font-medium mb-3">Sections</h2>
                        <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => createSection('title')} className="cursor-pointer h-7 px-2 text-xs"><Heading1 className="h-3.5 w-3.5 mr-1" /> Title</Button>
                            <Button size="sm" variant="outline" onClick={() => createSection('text')} className="cursor-pointer h-7 px-2 text-xs"><TypeIcon className="h-3.5 w-3.5 mr-1" /> Text</Button>
                            <Button size="sm" variant="outline" onClick={() => createSection('quote')} className="cursor-pointer h-7 px-2 text-xs"><Quote className="h-3.5 w-3.5 mr-1" /> Quote</Button>
                            <Button size="sm" variant="outline" onClick={() => createSection('image')} className="cursor-pointer h-7 px-2 text-xs"><ImageIcon className="h-3.5 w-3.5 mr-1" /> Image</Button>
                            <Button size="sm" variant="outline" onClick={() => createSection('code')} className="cursor-pointer h-7 px-2 text-xs"><Code className="h-3.5 w-3.5 mr-1" /> Code</Button>
                            <Button size="sm" variant="outline" onClick={() => createSection('video')} className="cursor-pointer h-7 px-2 text-xs"><Video className="h-3.5 w-3.5 mr-1" /> Video</Button>
                            <Button size="sm" variant="outline" onClick={() => createSection('map')} className="cursor-pointer h-7 px-2 text-xs"><MapPin className="h-3.5 w-3.5 mr-1" /> Map</Button>
                        </div>
                    </div>

                    {(localSections?.length ?? 0) === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 px-4 text-center border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/5">
                            <h3 className="text-base font-medium text-foreground mb-2">No sections yet</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Add content sections to build your article.
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center">
                                <Button size="sm" variant="outline" onClick={() => createSection('title')} className="h-8 px-3 text-xs">
                                    <Heading1 className="h-3.5 w-3.5 mr-1" /> Start with Title
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => createSection('text')} className="h-8 px-3 text-xs">
                                    <TypeIcon className="h-3.5 w-3.5 mr-1" /> Add Text
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => createSection('image')} className="h-8 px-3 text-xs">
                                    <ImageIcon className="h-3.5 w-3.5 mr-1" /> Add Image
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => createSection('code')} className="h-8 px-3 text-xs">
                                    <Code className="h-3.5 w-3.5 mr-1" /> Add Code
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-hidden">
                            <Table className="[&_td]:align-top">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[30px]">Order</TableHead>
                                        <TableHead className="w-[40px]"></TableHead>
                                        <TableHead>Content</TableHead>
                                        <TableHead className="w-[40px] text-right"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {localSections?.map((s) => {
                                        const isTarget = overInfo.id === s.id && (!!draggingId && draggingId !== s.id)
                                        const borderCue = isTarget ? (overInfo.where === 'above' ? 'border-t-2 border-primary' : 'border-b-2 border-primary') : ''
                                        return (
                                            <TableRow
                                                key={s.id}
                                                onDragOver={(e) => onDragOverRow(s.id, e)}
                                                onDrop={(e) => onDropRow(s.id, e)}
                                                className={`relative transition-colors ${isTarget ? 'bg-accent/50' : ''} ${borderCue}`}
                                            >
                                                <TableCell>
                                                    <button
                                                        aria-label="Drag to reorder"
                                                        draggable
                                                        onDragStart={(e) => onDragStart(s.id, e)}
                                                        onDragEnd={() => { setDraggingId(null); setOverInfo({ id: null, where: 'below' }) }}
                                                        className={`p-1 rounded hover:bg-accent text-muted-foreground cursor-grab active:cursor-grabbing ${draggingId === s.id ? 'opacity-60 ring-2 ring-primary/40' : ''}`}
                                                        title="Drag to reorder"
                                                    >
                                                        <GripVertical className="h-4 w-4" />
                                                    </button>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="mt-1">
                                                        {getSectionTypeIcon(s.type)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <SectionEditor
                                                        section={s}
                                                        onLocalChange={onLocalChangeHandlers[s.id]}
                                                        isDragging={!!draggingId}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => deleteSection(s.id)} className="cursor-pointer">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                            {/* Bottom drop zone */}
                            {localSections && localSections.length > 0 && (
                                <div
                                    onDragOver={onDragOverBottom}
                                    onDrop={(e) => onDropRow('bottom', e)}
                                    className={`w-full transition-all duration-200 cursor-pointer ${
                                        overInfo.id === 'bottom' && !!draggingId 
                                            ? 'h-4 bg-primary/20 border-t-2 border-primary' 
                                            : 'h-3 bg-muted/20'
                                    }`}
                                    style={{ marginTop: '-1px' }}
                                />
                            )}
                        </div>
                    )}
                </section>

                {/* Redirect URL */}
                <section className="space-y-4">
                    <div>
                        <Label htmlFor="redirect">Redirect URL</Label>
                        <Input id="redirect" value={redirect} onChange={(e) => setRedirect(e.target.value)} placeholder="Redirect URL (optional)" />
                    </div>
                </section>

                {/* Sticky bottom actions — stop before agent rail */}
                <div className="fixed bottom-0 inset-x-0 md:left-[18rem] md:right-0 lg:left-[20rem] lg:right-0 xl:left-[24rem] xl:right-0 z-20 border-t bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
                    <div className="px-6 py-3 flex items-center justify-between max-w-6xl mx-auto">
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            {article.published ? <span className="text-green-600">Published</span> : <span className="text-amber-600">Draft</span>}
                            {article.publishedAt && <span>• {formatDateForDisplay(article.publishedAt)}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="secondary"
                                className="whitespace-nowrap cursor-pointer"
                                onClick={() => updateArticle.mutate({ published: !article.published, publishedAt: !article.published ? new Date().toISOString() : null })}
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
                </div>
            </div>
        </>
    )
}

function SectionEditor({ section, onLocalChange, isDragging = false }: { section: any; onLocalChange: (data: Partial<any>) => void; isDragging?: boolean }) {
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
    if (section.type === 'code') {
        return <CodeSectionEditor section={section} onLocalChange={onLocalChange} isDragging={isDragging} />
    }
    return <span className="text-sm text-muted-foreground">Unsupported section</span>
}

function TitleEditor({ section, onLocalChange }: { section: any; onLocalChange: (data: Partial<any>) => void }) {
    const [value, setValue] = useState(section.content ?? '')

    useEffect(() => {
        onLocalChange({ content: value, type: 'title' })
    }, [value])

    return (
        <div className="space-y-1">
            <Label htmlFor={`title-${section.id}`}>Title</Label>
            <Input
                id={`title-${section.id}`}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Section title"
            />
        </div>
    )
}

function QuoteEditor({ section, onLocalChange }: { section: any; onLocalChange: (data: Partial<any>) => void }) {
    const [quote, setQuote] = useState(section.content ?? '')
    const [speaker, setSpeaker] = useState(section.speaker ?? '')

    useEffect(() => {
        onLocalChange({ content: quote, speaker, type: 'quote' })
    }, [quote, speaker])

    return (
        <div className="space-y-2">
            <div className="space-y-1">
                <Label htmlFor={`quote-${section.id}`}>Quote</Label>
                <Textarea id={`quote-${section.id}`} value={quote} onChange={(e) => setQuote(e.target.value)} placeholder="Add a memorable line…" rows={2} />
            </div>
            <div className="space-y-1">
                <Label htmlFor={`speaker-${section.id}`}>Speaker</Label>
                <Input id={`speaker-${section.id}`} value={speaker} onChange={(e) => setSpeaker(e.target.value)} placeholder="Who said it?" />
            </div>
        </div>
    )
}

function TextEditor({ section, onLocalChange }: { section: any; onLocalChange: (data: Partial<any>) => void }) {
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
            <Label htmlFor={`text-${section.id}`}>Text</Label>
            <Textarea
                id={`text-${section.id}`}
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

function ImageEditor({ section, onLocalChange }: { section: any; onLocalChange: (data: Partial<any>) => void }) {
    // Convert mediaId to array format for ImageGallery, also check for imageIds
    const selectedImageIds = section.imageIds || (section.mediaId ? [section.mediaId] : [])
    
    const handleImagesChange = (imageIds: string[]) => {
        // Store all selected images
        onLocalChange({ 
            imageIds: imageIds,
            // For backward compatibility, we'll use the first selected image as mediaId
            mediaId: imageIds.length > 0 ? imageIds[0] : null
        })
    }

    return (
        <div className="space-y-4">
            <ImageGallery 
                selectedImageIds={selectedImageIds}
                onImagesChange={handleImagesChange}
            />
            <div className="space-y-1">
                <Label htmlFor={`caption-${section.id}`}>Caption</Label>
                <Input 
                    id={`caption-${section.id}`} 
                    value={section.caption ?? ''} 
                    onChange={(e) => onLocalChange({ caption: e.target.value })} 
                    placeholder="Caption (optional)" 
                />
            </div>
        </div>
    )
}

function VideoEditor({ section, onLocalChange }: { section: any; onLocalChange: (data: Partial<any>) => void }) {
    const [url, setUrl] = useState(section.embedUrl ?? '')
    const embed = toYouTubeEmbed(url)

    useEffect(() => {
        onLocalChange({ embedUrl: url })
    }, [url])

    return (
        <div className="space-y-2">
            <div className="space-y-1">
                <Label htmlFor={`video-url-${section.id}`}>Video URL</Label>
                <Input id={`video-url-${section.id}`} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste YouTube URL" />
            </div>
            {embed && (
                <div className="aspect-video w-full">
                    <iframe className="w-full h-full rounded-lg border" src={embed} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="YouTube preview" />
                </div>
            )}
            <div className="space-y-1">
                <Label htmlFor={`caption-${section.id}`}>Caption</Label>
                <Input id={`caption-${section.id}`} value={section.caption ?? ''} onChange={(e) => onLocalChange({ caption: e.target.value })} placeholder="Caption (optional)" />
            </div>
        </div>
    )
}

function MapEditor({ section, onLocalChange }: { section: any; onLocalChange: (data: Partial<any>) => void }) {
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
                    <Label htmlFor={`lat-${section.id}`}>Latitude</Label>
                    <Input id={`lat-${section.id}`} placeholder="e.g. 37.7749" value={lat as any} onChange={(e) => setLat(e.target.value as any)} />
                </div>
                <div className="space-y-1">
                    <Label htmlFor={`lng-${section.id}`}>Longitude</Label>
                    <Input id={`lng-${section.id}`} placeholder="e.g. -122.4194" value={lng as any} onChange={(e) => setLng(e.target.value as any)} />
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

function CodeSectionEditor({ section, onLocalChange, isDragging = false }: { section: any; onLocalChange: (data: Partial<any>) => void; isDragging?: boolean }) {
    const [code, setCode] = useState(section.content ?? '')
    const [language, setLanguage] = useState('javascript')

    // Parse language from section data
    useEffect(() => {
        if (section.data) {
            try {
                const data = JSON.parse(section.data)
                setLanguage(data.language ?? 'javascript')
            } catch (e) {
                // If data is not JSON, treat it as plain text (backward compatibility)
                setLanguage(section.language ?? 'javascript')
            }
        } else {
            setLanguage(section.language ?? 'javascript')
        }
    }, [section.data, section.language])

    const handleCodeChange = useCallback((newCode: string) => {
        setCode(newCode)
        onLocalChange({ content: newCode })
    }, [onLocalChange])

    const handleLanguageChange = useCallback((newLanguage: string) => {
        setLanguage(newLanguage)
        // Store language in section data for persistence
        const data = section.data ? JSON.parse(section.data) : {}
        data.language = newLanguage
        onLocalChange({ data: JSON.stringify(data) })
    }, [onLocalChange, section.data])

    return (
        <div className="space-y-2">
            <CodeEditor
                value={code}
                onChange={handleCodeChange}
                language={language}
                onLanguageChange={handleLanguageChange}
                isDragging={isDragging}
            />
        </div>
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

function sanitizeSectionUpdate(data: Partial<Omit<any, keyof Models.Document>>) {
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

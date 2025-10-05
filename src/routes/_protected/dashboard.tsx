import { createFileRoute, Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useAuth } from '@/hooks/use-auth'
import { useEffect, useMemo, useRef, useState, useCallback, memo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { db } from '@/lib/appwrite/db'
import { files } from '@/lib/appwrite/storage'
import { getAccountClient } from '@/lib/appwrite'
import type { Articles } from '@/lib/appwrite/appwrite.types'
import { Query, type Models } from 'appwrite'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'
import { Image as ImageIcon, Plus, Trash2, Save, Video, MapPin, Type as TypeIcon, Upload, ArrowLeft, LogOut, GripVertical, Brain, Loader2, Heading1, Quote, Pin as PinIcon, FileText, Quote as QuoteIcon, Code, ChevronLeft, ChevronRight, MoreHorizontal, Copy, MessageCircle, Eye, EyeOff } from 'lucide-react'
import { AgentChat } from '@/components/agent/agent-chat'
import { AuthorSelector } from '@/components/author'
import { CategorySelector } from '@/components/category'
import { ImageGallery } from '@/components/image'
import { NotificationBell } from '@/components/notification'
import { TeamBlogSelector } from '@/components/team-blog'
import { CodeEditor } from '@/components/ui/code-editor'
import { UserAvatar } from '@/components/user-avatar'
import { useTeamBlog } from '@/hooks/use-team-blog'
import { TeamBlogProvider, useTeamBlogContext } from '@/contexts/team-blog-context'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { formatDateForDisplay, formatDateCompact, formatDateRelative } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import { CommentableInput, CommentableSection, useCommentCounts, useAllComments, CommentPopover } from '@/components/comments'

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
        <TeamBlogProvider userId={userId}>
            <div className="h-dvh overflow-y-auto overscroll-none flex flex-col">
                <Header userId={userId} onSignOut={() => signOut.mutate()} user={user} />
                <Dashboard userId={userId} />
            </div>
        </TeamBlogProvider>
    )
}

function Header({ userId, onSignOut, user }: { userId: string; onSignOut: () => void; user: any }) {
    return (
        <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
            <div className="px-6 h-16 flex items-center justify-between">
                {/* Left side - Team/Blog Selector */}
                <div className="flex items-center gap-6 -ml-2">
                    <nav className="flex items-center gap-4 text-sm text-muted-foreground">
                        <TeamBlogSelector userId={userId} />
                    </nav>
                </div>
                
                {/* Center - Logo */}
                <div className="flex items-center justify-center absolute left-1/2 transform -translate-x-1/2">
                    <Link to="/" className="font-semibold tracking-tight inline-flex items-center gap-2">
                        <Brain className="h-6 w-6" />
                        Cortext
                    </Link>
                </div>
                
                {/* Right side - User actions */}
                <div className="flex items-center gap-4">
                    <NotificationBell userId={userId} />
                    <UserAvatar user={user} onSignOut={onSignOut} />
                </div>
            </div>
        </header>
    )
}

function Dashboard({ userId }: { userId: string }) {
    const search = useSearch({ strict: false }) as { articleId?: string }
    const navigate = useNavigate()
    const { currentBlog } = useTeamBlogContext()
    const editingId = search?.articleId || null

    if (editingId) {
        return (
            <main className="flex-1">
                <div className="px-12 py-6">
                    <ArticleEditor key={editingId} articleId={editingId} userId={userId} onBack={() => navigate({ to: '/dashboard', search: {} })} />
                </div>
            </main>
        )
    }

    return <ArticlesList key={currentBlog?.$id || 'no-blog'} userId={userId} />
}

function EmptyArticlesState({ currentBlog, userId }: { currentBlog: any; userId: string }) {
    const navigate = useNavigate()
    const { currentTeam } = useTeamBlogContext()
    
    return (
        <div className="flex flex-col items-center justify-center py-24 px-6">
            <div className="text-center space-y-6 max-w-md">
                <div className="space-y-3">
                    <h2 className="text-2xl font-semibold text-foreground">
                        {currentBlog ? `No articles` : 'No articles yet'}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                        {currentBlog 
                            ? 'Create your first article to get started.'
                            : 'Start writing your first article.'
                        }
                    </p>
                </div>
                
                <Button 
                    size="sm" 
                    className="cursor-pointer"
                    onClick={async () => {
                        try {
                            const payload: Omit<Articles, keyof Models.Document> = {
                                trailer: null,
                                title: 'Untitled',
                                status: 'unpublished',
                                subtitle: null,
                                images: null,
                                body: null,
                                authors: null,
                                live: false,
                                pinned: false,
                                redirect: null,
                                categories: null,
                                createdBy: userId,
                                published: false,
                                slug: null,
                                publishedAt: null,
                                blogId: currentBlog?.$id || null,
                            }
                            const article = await db.articles.create(payload, currentTeam?.$id)
                            navigate({ to: '/dashboard', search: { articleId: article.$id } })
                        } catch (error) {
                            toast({ 
                                title: 'Failed to create article', 
                                description: error instanceof Error ? error.message : 'Unknown error',
                                variant: 'destructive'
                            })
                        }
                    }}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Article
                </Button>
            </div>
        </div>
    )
}


// Memoized search input component to prevent unnecessary re-renders
const SearchInput = memo(({ 
    query, 
    onQueryChange, 
    isFetching 
}: { 
    query: string
    onQueryChange: (value: string) => void
    isFetching: boolean 
}) => {
    const searchInputRef = useRef<HTMLInputElement>(null)
    const [isSearchFocused, setIsSearchFocused] = useState(false)

    return (
        <div className="relative max-w-sm w-full">
            <Input
                ref={searchInputRef}
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="Search articles..."
                className="h-9 pr-8"
                aria-label="Search articles"
            />
            {isFetching && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
            )}
        </div>
    )
})

SearchInput.displayName = 'SearchInput'

function ArticlesList({ userId }: { userId: string }) {
    const qc = useQueryClient()
    const navigate = useNavigate()
    const { currentBlog, currentTeam } = useTeamBlogContext()

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 10 // Fixed page size
    const [query, setQuery] = useState('')
    const [debouncedQuery, setDebouncedQuery] = useState('')

    // Debounce search query to avoid excessive API calls
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query)
        }, 300) // 300ms debounce

        return () => clearTimeout(timer)
    }, [query])

    const { data: articleList, isPending: loadingArticles, isFetching } = useQuery({
        queryKey: ['articles', userId, currentBlog?.$id, currentPage, pageSize, debouncedQuery],
        queryFn: async () => {
            const queries = [
                Query.equal('createdBy', [userId]),
                Query.orderDesc('$updatedAt'),
                Query.limit(pageSize),
                Query.offset((currentPage - 1) * pageSize),
            ]
            
            // Only filter by blog ID if a blog is selected
            if (currentBlog?.$id) {
                queries.push(Query.equal('blogId', currentBlog.$id))
            }

            // Add search query if provided
            if (debouncedQuery.trim()) {
                queries.push(Query.search('title', debouncedQuery.trim()))
            }
            
            const res = await db.articles.list(queries)
            return res
        },
        enabled: !!userId,
        placeholderData: (previousData) => previousData // Keep previous data while fetching new data
    })

    const togglePin = useMutation({
        mutationFn: async ({ id, next }: { id: string; next: boolean }) => {
            const current = await db.articles.get(id)
            if (current.createdBy !== userId) throw new Error('Forbidden')
            return db.articles.update(id, { pinned: next })
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['articles', userId, currentBlog?.$id] })
        },
        onError: () => toast({ title: 'Failed to update pin' }),
    })

    // Reset to first page when search query changes
    useEffect(() => {
        setCurrentPage(1)
    }, [debouncedQuery])

    const all = articleList?.documents ?? []
    const pinned = all.filter((a) => a.pinned)
    const others = all.filter((a) => !a.pinned)

    // Calculate pagination info
    const totalCount = articleList?.total ?? 0
    const totalPages = Math.ceil(totalCount / pageSize)
    const hasNextPage = currentPage < totalPages
    const hasPrevPage = currentPage > 1

    const ColGroup = () => (
        <colgroup>
            <col className="w-[85%]" />
            <col className="hidden sm:table-column w-[15%]" />
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
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((a) => (
                        <TableRow key={a.$id} className="group">
                            <TableCell className="max-w-[420px] truncate">
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`cursor-pointer p-1 h-auto ${a.pinned ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}
                                        onClick={() => togglePin.mutate({ id: a.$id, next: !a.pinned })}
                                        title={a.pinned ? 'Unpin' : 'Pin'}
                                    >
                                        <PinIcon 
                                            className={`h-4 w-4 ${a.pinned ? 'text-primary' : 'text-muted-foreground'}`} 
                                            fill={a.pinned ? 'currentColor' : 'none'}
                                        />
                                    </Button>
                                    <Link to="/dashboard" search={{ articleId: a.$id }} className="hover:underline">
                                        {a.title || 'Untitled'}
                                    </Link>
                                    {!a.published && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white text-black border border-black/20">
                                            Draft
                                        </span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                                {formatDateRelative(a.$updatedAt)}
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
                <div className="flex items-center justify-between gap-4">
                    <SearchInput
                        query={query}
                        onQueryChange={setQuery}
                        isFetching={isFetching}
                    />
                    <Button 
                        size="sm" 
                        variant="outline" 
                        className="cursor-pointer"
                        onClick={async () => {
                            try {
                                const payload: Omit<Articles, keyof Models.Document> = {
                                    trailer: null,
                                    title: 'Untitled',
                                    status: 'unpublished',
                                    subtitle: null,
                                    images: null,
                                    body: null,
                                    authors: null,
                                    live: false,
                                    pinned: false,
                                    redirect: null,
                                    categories: null,
                                    createdBy: userId,
                                    published: false,
                                    slug: null,
                                    publishedAt: null,
                                    blogId: currentBlog?.$id || null,
                                }
                                const article = await db.articles.create(payload, currentTeam?.$id)
                                navigate({ to: '/dashboard', search: { articleId: article.$id } })
                            } catch (error) {
                                toast({ 
                                    title: 'Failed to create article', 
                                    description: error instanceof Error ? error.message : 'Unknown error',
                                    variant: 'destructive'
                                })
                            }
                        }}
                    >
                        <Plus className="h-4 w-4 mr-1" /> New Article
                    </Button>
                </div>

                {loadingArticles && !articleList ? (
                    <div className="text-sm text-muted-foreground">Loading…</div>
                ) : all.length === 0 ? (
                    <EmptyArticlesState currentBlog={currentBlog} userId={userId} />
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
                                <p className="text-sm text-muted-foreground">
                                    {debouncedQuery ? 'No articles match your search.' : 'No articles found.'}
                                </p>
                            ) : (
                                <ArticlesTable rows={others as Articles[]} />
                            )}
                        </section>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    {debouncedQuery ? (
                                        <>Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} search results</>
                                    ) : (
                                        <>Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} articles</>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={!hasPrevPage}
                                        className="cursor-pointer"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }
                                            
                                            return (
                                                <Button
                                                    key={pageNum}
                                                    variant={currentPage === pageNum ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className="cursor-pointer w-8 h-8 p-0"
                                                >
                                                    {pageNum}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={!hasNextPage}
                                        className="cursor-pointer"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                    </div>
                )}
            </div>
        </main>
    )
}

function CreateArticleView({ userId, onDone, onCancel }: { userId: string; onDone: (id: string) => void; onCancel: () => void }) {
    const qc = useQueryClient()
    const { currentBlog, currentTeam } = useTeamBlogContext()
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
                blogId: currentBlog?.$id || null,
            }
            return db.articles.create(payload, currentTeam?.$id)
        },
        onSuccess: (doc) => {
            qc.invalidateQueries({ queryKey: ['articles', userId, currentBlog?.$id] })
            toast({ title: 'Article created' })
            onDone(doc.$id)
        },
        onError: (error) => {
            console.error('Article creation error:', error)
            toast({ 
                title: 'Failed to create article', 
                description: error instanceof Error ? error.message : 'Unknown error',
                variant: 'destructive'
            })
        },
    })

    return (
        <main className="flex-1">
            <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={onCancel}>
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
                            userId={userId}
                        />
                    </div>
                    <div>
                        <CategorySelector 
                            selectedCategoryIds={categories}
                            onCategoriesChange={setCategories}
                            userId={userId}
                        />
                    </div>
                    <div>
                        <Label htmlFor="new-redirect">Redirect URL</Label>
                        <Input id="new-redirect" value={redirect} onChange={(e) => setRedirect(e.target.value)} placeholder="Redirect URL (optional)" />
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => createArticle.mutate()} disabled={createArticle.isPending}>
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
    const navigate = useNavigate()
    const { currentBlog, currentTeam } = useTeamBlogContext()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false)
            }
        }

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isMenuOpen])

    const { data: article, isPending } = useQuery({
        queryKey: ['article', articleId],
        queryFn: () => db.articles.get(articleId),
    })

    // User preferences for hide comments
    const account = getAccountClient()
    const { data: userPrefs } = useQuery({
        queryKey: ['auth', 'preferences'],
        queryFn: () => account.getPrefs(),
        retry: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
    })

    // Load hide comments preference
    useEffect(() => {
        if (userPrefs) {
            setHideComments(userPrefs.hideComments || false)
        }
    }, [userPrefs])

    // Mutation to update hide comments preference
    const updateHideCommentsMutation = useMutation({
        mutationFn: async (hide: boolean) => {
            const currentPrefs = userPrefs || {}
            const updatedPrefs = { ...currentPrefs, hideComments: hide }
            return account.updatePrefs(updatedPrefs)
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['auth', 'preferences'] })
            setHideComments(!hideComments)
        },
        onError: () => {
            toast({ 
                title: 'Failed to update preference', 
                description: 'Could not save comment visibility setting',
                variant: 'destructive'
            })
        }
    })

    const [localSections, setLocalSections] = useState<any[]>([])
    const [rowPositions, setRowPositions] = useState<Record<string, { top: number; height: number }>>({})
    const rowRefs = useRef<Record<string, HTMLTableRowElement>>({})
    const [hideComments, setHideComments] = useState(false)
    const [hoveredRowId, setHoveredRowId] = useState<string | null>(null)
    const [openPopoverId, setOpenPopoverId] = useState<string | null>(null)
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Handle hover with delay to prevent flickering when moving to comment button
    const handleRowMouseEnter = (rowId: string) => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current)
        }
        setHoveredRowId(rowId)
    }

    const handleRowMouseLeave = () => {
        hoverTimeoutRef.current = setTimeout(() => {
            // Only hide if no popover is open for this row
            if (openPopoverId !== hoveredRowId) {
                setHoveredRowId(null)
            }
        }, 150) // 150ms delay
    }

    const handleCommentButtonMouseEnter = (rowId: string) => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current)
        }
        setHoveredRowId(rowId)
    }

    const handleCommentButtonMouseLeave = () => {
        hoverTimeoutRef.current = setTimeout(() => {
            // Only hide if no popover is open for this row
            if (openPopoverId !== hoveredRowId) {
                setHoveredRowId(null)
            }
        }, 150) // 150ms delay
    }

    // Handle popover open/close
    const handlePopoverOpen = (rowId: string) => {
        setOpenPopoverId(rowId)
        setHoveredRowId(rowId) // Ensure the button stays visible
    }

    const handlePopoverClose = () => {
        setOpenPopoverId(null)
        // Clear any existing timeouts and hide the button immediately
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current)
        }
        setHoveredRowId(null)
    }

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current)
            }
        }
    }, [])

    // Comment targets for the article
    const commentTargets = [
        { type: 'trailer' },
        { type: 'title' },
        { type: 'subtitle' },
        { type: 'redirect' },
        ...(localSections?.map(section => ({ type: 'section', id: section.id })) || [])
    ]

    const { getCommentCount } = useCommentCounts(
        articleId,
        currentBlog?.$id || '',
        commentTargets
    )

    // Pre-load all comments for the article to eliminate layout shift
    useAllComments(articleId, currentBlog?.$id || '')

    // Function to measure and update row positions
    const updateRowPositions = useCallback(() => {
        const newPositions: Record<string, { top: number; height: number }> = {}
        const tableContainer = document.querySelector('.sections-table-container')
        
        if (tableContainer) {
            Object.entries(rowRefs.current).forEach(([sectionId, rowElement]) => {
                if (rowElement) {
                    const rect = rowElement.getBoundingClientRect()
                    const containerRect = tableContainer.getBoundingClientRect()
                    newPositions[sectionId] = {
                        top: rect.top - containerRect.top,
                        height: rect.height
                    }
                }
            })
            setRowPositions(newPositions)
        }
    }, [])

    // Update row positions when sections change or after render
    useEffect(() => {
        const timer = setTimeout(updateRowPositions, 0) // Use setTimeout to ensure DOM is updated
        return () => clearTimeout(timer)
    }, [localSections, updateRowPositions])

    // Update row positions on window resize
    useEffect(() => {
        const handleResize = () => updateRowPositions()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [updateRowPositions])

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
            qc.invalidateQueries({ queryKey: ['articles', userId, currentBlog?.$id] })
        },
        onError: () => toast({ title: 'Failed to save article' }),
    })

    const deleteArticle = useMutation({
        mutationFn: async () => {
            const current = await db.articles.get(articleId)
            if (current.createdBy !== userId) throw new Error('Forbidden')
            return db.articles.delete(articleId)
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['articles', userId, currentBlog?.$id] })
            toast({ title: 'Article deleted successfully' })
            onBack() // Navigate back to articles list
        },
        onError: (error) => {
            console.error('Article deletion error:', error)
            toast({ 
                title: 'Failed to delete article', 
                description: error instanceof Error ? error.message : 'Unknown error',
                variant: 'destructive'
            })
        },
    })

    const duplicateArticle = useMutation({
        mutationFn: async () => {
            const current = await db.articles.get(articleId)
            if (current.createdBy !== userId) throw new Error('Forbidden')
            
            // Create a copy of the article with a new ID
            const duplicateData: Omit<Articles, keyof Models.Document> = {
                trailer: current.trailer,
                title: `${current.title} (Copy)`,
                status: 'unpublished', // Always create as unpublished
                subtitle: current.subtitle,
                images: current.images,
                body: current.body, // Copy all sections
                authors: current.authors,
                live: false, // Always create as not live
                pinned: false, // Don't copy pin status
                redirect: current.redirect,
                categories: current.categories,
                createdBy: userId,
                published: false, // Always create as unpublished
                slug: null, // Will be generated from title
                publishedAt: null,
                blogId: current.blogId,
            }
            
            return db.articles.create(duplicateData, currentTeam?.$id)
        },
        onSuccess: (newArticle) => {
            qc.invalidateQueries({ queryKey: ['articles', userId, currentBlog?.$id] })
            toast({ 
                title: 'Article duplicated successfully',
                description: `Created "${newArticle.title}"`
            })
            // Navigate to the new article
            navigate({ to: '/dashboard', search: { articleId: newArticle.$id } })
        },
        onError: (error) => {
            console.error('Article duplication error:', error)
            toast({ 
                title: 'Failed to duplicate article', 
                description: error instanceof Error ? error.message : 'Unknown error',
                variant: 'destructive'
            })
        },
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

    // Function to count words, characters, and assets from sections
    const getContentStats = () => {
        if (!localSections) return { words: 0, characters: 0, assets: 0 }
        
        let totalWords = 0
        let totalCharacters = 0
        let totalAssets = 0
        
        localSections.forEach(section => {
            let textContent = ''
            
            switch (section.type) {
                case 'title':
                case 'text':
                case 'paragraph':
                    textContent = section.content || ''
                    break
                case 'quote':
                    textContent = (section.content || '') + ' ' + (section.speaker || '')
                    break
                case 'code':
                    textContent = section.content || ''
                    break
                case 'image':
                case 'video':
                case 'map':
                    textContent = section.caption || ''
                    totalAssets += 1
                    break
                default:
                    textContent = ''
            }
            
            // Count words by splitting on whitespace and filtering out empty strings
            const words = textContent.trim().split(/\s+/).filter(word => word.length > 0)
            totalWords += words.length
            totalCharacters += textContent.length
        })
        
        return { words: totalWords, characters: totalCharacters, assets: totalAssets }
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

    useEffect(() => {
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
                    <Button variant="ghost" size="sm" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4 mr-1" /> Back to articles
                    </Button>
                    
                    <div ref={menuRef} className="relative">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="cursor-pointer"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        
                        {isMenuOpen && (
                            <>
                                {/* Arrow pointing to the button */}
                                <div className="absolute right-3 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-border z-50" />
                                <div className="absolute right-0 top-full mt-1 w-56 bg-background border rounded-lg shadow-lg z-50 animate-in fade-in-0 zoom-in-95 duration-200">
                                    <div className="p-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                duplicateArticle.mutate()
                                                setIsMenuOpen(false)
                                            }}
                                            disabled={duplicateArticle.isPending}
                                            className="w-full justify-start cursor-pointer hover:bg-accent"
                                        >
                                            {duplicateArticle.isPending ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Duplicating...
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="h-4 w-4 mr-2" />
                                                    Duplicate
                                                </>
                                            )}
                                        </Button>
                                        
                                        <Separator className="my-1" />
                                        
                                        <div className="flex items-center justify-between px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                {hideComments ? (
                                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                                                )}
                                                <span className="text-sm">Hide Comments</span>
                                            </div>
                                            <Switch
                                                checked={hideComments}
                                                onCheckedChange={(checked) => {
                                                    updateHideCommentsMutation.mutate(checked)
                                                }}
                                                disabled={updateHideCommentsMutation.isPending}
                                            />
                                        </div>
                                        
                                        <Separator className="my-1" />
                                        
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full justify-start cursor-pointer hover:bg-destructive/10 hover:text-destructive text-destructive"
                                            onClick={() => {
                                                setIsMenuOpen(false)
                                                setShowDeleteConfirm(true)
                                            }}
                                            disabled={deleteArticle.isPending}
                                        >
                                            {deleteArticle.isPending ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Deleting...
                                                </>
                                            ) : (
                                                <>
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex justify-center px-6 py-6 pb-24 ml-0 md:ml-[18rem] lg:ml-[20rem] xl:ml-[24rem]">
                <div className="w-full max-w-3xl space-y-8">

                {/* Article meta form */}
                <section className="space-y-4">
                    <div>
                        <Label htmlFor="trailer">Trailer</Label>
                        {hideComments ? (
                            <Input id="trailer" value={trailer} onChange={(e) => setTrailer(e.target.value)} placeholder="Breaking news, Exclusive..." />
                        ) : (
                            <CommentableInput
                                articleId={articleId}
                                blogId={currentBlog?.$id || ''}
                                targetType="trailer"
                                commentCount={getCommentCount('trailer').count}
                                hasNewComments={getCommentCount('trailer').hasNewComments}
                            >
                                <Input id="trailer" value={trailer} onChange={(e) => setTrailer(e.target.value)} placeholder="Breaking news, Exclusive..." />
                            </CommentableInput>
                        )}
                    </div>
                    <div className="md:col-span-2">
                        <Label htmlFor="title">Title</Label>
                        <div className="relative">
                            {hideComments ? (
                                <Input 
                                    id="title" 
                                    value={title} 
                                    onChange={(e) => setTitle(e.target.value)} 
                                    placeholder="Article title" 
                                    className="pr-32" 
                                />
                            ) : (
                                <CommentableInput
                                    articleId={articleId}
                                    blogId={currentBlog?.$id || ''}
                                    targetType="title"
                                    commentCount={getCommentCount('title').count}
                                    hasNewComments={getCommentCount('title').hasNewComments}
                                >
                                    <Input 
                                        id="title" 
                                        value={title} 
                                        onChange={(e) => setTitle(e.target.value)} 
                                        placeholder="Article title" 
                                        className="pr-32" 
                                    />
                                </CommentableInput>
                            )}
                            <div className="absolute right-3 mr-2 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                                <Checkbox id="live" checked={live} onCheckedChange={(checked) => setLive(checked === true)} />
                                <Label htmlFor="live" className="text-xs text-muted-foreground inline-label">Live</Label>
                            </div>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="subtitle">Subtitle</Label>
                        {hideComments ? (
                            <Input id="subtitle" value={subtitle} onChange={(e) => setExcerpt(e.target.value)} placeholder="Short summary (optional)" />
                        ) : (
                            <CommentableInput
                                articleId={articleId}
                                blogId={currentBlog?.$id || ''}
                                targetType="subtitle"
                                commentCount={getCommentCount('subtitle').count}
                                hasNewComments={getCommentCount('subtitle').hasNewComments}
                            >
                                <Input id="subtitle" value={subtitle} onChange={(e) => setExcerpt(e.target.value)} placeholder="Short summary (optional)" />
                            </CommentableInput>
                        )}
                    </div>
                    <div>
                        <AuthorSelector 
                            selectedAuthorIds={authors}
                            onAuthorsChange={setAuthors}
                            userId={userId}
                        />
                    </div>
                    <div>
                        <CategorySelector 
                            selectedCategoryIds={categories}
                            onCategoriesChange={setCategories}
                            userId={userId}
                        />
                    </div>
                </section>

                {/* Sections composer */}
                <section className="space-y-4">
                    <div>
                        <h2 className="text-base font-medium mb-3">Sections</h2>
                        <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => createSection('title')} className="h-7 px-2 text-xs"><Heading1 className="h-3.5 w-3.5 mr-1" /> Title</Button>
                            <Button size="sm" variant="outline" onClick={() => createSection('text')} className="h-7 px-2 text-xs"><TypeIcon className="h-3.5 w-3.5 mr-1" /> Text</Button>
                            <Button size="sm" variant="outline" onClick={() => createSection('quote')} className="h-7 px-2 text-xs"><Quote className="h-3.5 w-3.5 mr-1" /> Quote</Button>
                            <Button size="sm" variant="outline" onClick={() => createSection('image')} className="h-7 px-2 text-xs"><ImageIcon className="h-3.5 w-3.5 mr-1" /> Image</Button>
                            <Button size="sm" variant="outline" onClick={() => createSection('code')} className="h-7 px-2 text-xs"><Code className="h-3.5 w-3.5 mr-1" /> Code</Button>
                            <Button size="sm" variant="outline" onClick={() => createSection('video')} className="h-7 px-2 text-xs"><Video className="h-3.5 w-3.5 mr-1" /> Video</Button>
                            <Button size="sm" variant="outline" onClick={() => createSection('map')} className="h-7 px-2 text-xs"><MapPin className="h-3.5 w-3.5 mr-1" /> Map</Button>
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
                        <div className="relative sections-table-container">
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
                                                    ref={(el) => {
                                                        if (el) {
                                                            rowRefs.current[s.id] = el
                                                        }
                                                    }}
                                                    onDragOver={(e) => onDragOverRow(s.id, e)}
                                                    onDrop={(e) => onDropRow(s.id, e)}
                                                    onMouseEnter={() => handleRowMouseEnter(s.id)}
                                                    onMouseLeave={handleRowMouseLeave}
                                                    className={`relative group ${isTarget ? 'bg-accent/50' : ''} ${borderCue} hover:bg-transparent`}
                                                    data-row-id={s.id}
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
                                                            userId={userId}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" onClick={() => deleteSection(s.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                        {/* Content stats row - merged columns, no background, smaller */}
                                        <TableRow className="hover:bg-transparent">
                                            <TableCell colSpan={4} className="py-2">
                                                <div className="text-xs text-muted-foreground">
                                                    {(() => {
                                                        const stats = getContentStats()
                                                        return (
                                                            <>
                                                                <strong className="text-foreground">{stats.words}</strong> {stats.words === 1 ? 'word' : 'words'} • 
                                                                <strong className="text-foreground"> {stats.characters}</strong> {stats.characters === 1 ? 'character' : 'characters'} • 
                                                                <strong className="text-foreground"> {stats.assets}</strong> {stats.assets === 1 ? 'asset' : 'assets'}
                                                            </>
                                                        )
                                                    })()}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                            
                            {/* Comment buttons positioned outside the table but relative to rows */}
                            {!hideComments && localSections?.map((s) => {
                                const position = rowPositions[s.id]
                                if (!position) return null // Don't render until position is measured
                                
                                const commentCount = getCommentCount('section', s.id).count;
                                const isHovered = hoveredRowId === s.id;
                                const isPopoverOpen = openPopoverId === s.id;
                                return (
                                    <div 
                                        key={`comment-${s.id}`}
                                        className={cn(
                                            "absolute -right-[66px] flex items-start justify-center pt-2 transition-opacity duration-200 w-16",
                                            commentCount > 0 ? "opacity-100" : (isHovered || isPopoverOpen ? "opacity-100" : "opacity-0")
                                        )}
                                        style={{ 
                                            top: `${position.top}px`,
                                            height: `${position.height}px`
                                        }}
                                        data-row-id={s.id}
                                        onMouseEnter={() => handleCommentButtonMouseEnter(s.id)}
                                        onMouseLeave={handleCommentButtonMouseLeave}
                                    >
                                        <CommentPopover
                                            articleId={articleId}
                                            blogId={currentBlog?.$id || ''}
                                            targetType="section"
                                            targetId={s.id}
                                            commentCount={getCommentCount('section', s.id).count}
                                            hasNewComments={getCommentCount('section', s.id).hasNewComments}
                                            side="left"
                                            onOpen={() => handlePopoverOpen(s.id)}
                                            onClose={handlePopoverClose}
                                        />
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </section>

                {/* Redirect URL */}
                <section className="space-y-4">
                    <div>
                        <Label htmlFor="redirect">Redirect URL</Label>
                        {hideComments ? (
                            <Input id="redirect" value={redirect} onChange={(e) => setRedirect(e.target.value)} placeholder="Redirect URL (optional)" />
                        ) : (
                            <CommentableInput
                                articleId={articleId}
                                blogId={currentBlog?.$id || ''}
                                targetType="redirect"
                                commentCount={getCommentCount('redirect').count}
                                hasNewComments={getCommentCount('redirect').hasNewComments}
                            >
                                <Input id="redirect" value={redirect} onChange={(e) => setRedirect(e.target.value)} placeholder="Redirect URL (optional)" />
                            </CommentableInput>
                        )}
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
                            <Button onClick={handleMainSave} disabled={saving}>
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

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-left">
                            Delete Article
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-left">
                            Are you sure you want to delete <strong>"{title || 'Untitled'}"</strong>? 
                            This action cannot be undone and will permanently remove the article 
                            and all its data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel className="order-2 sm:order-1">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                deleteArticle.mutate()
                                setShowDeleteConfirm(false)
                            }}
                            className="order-1 sm:order-2 bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 cursor-pointer"
                            disabled={deleteArticle.isPending}
                        >
                            {deleteArticle.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Yes, Delete Article'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

function SectionEditor({ section, onLocalChange, isDragging = false, userId }: { section: any; onLocalChange: (data: Partial<any>) => void; isDragging?: boolean; userId: string }) {
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
        return <ImageEditor section={section} onLocalChange={onLocalChange} userId={userId} />
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

function ImageEditor({ section, onLocalChange, userId }: { section: any; onLocalChange: (data: Partial<any>) => void; userId: string }) {
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
                userId={userId}
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
                <div className="w-full aspect-video rounded-lg border overflow-hidden">
                    <iframe className="w-full h-full" src={iframe} title="Map preview" />
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

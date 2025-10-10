import { createFileRoute, Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useAuth } from '@/hooks/use-auth'
import { useEffect, useMemo, useRef, useState, useCallback, memo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { db, createInitialRevision, createUpdateRevision, createRevertRevision } from '@/lib/appwrite/db'
import { useLatestRevision } from '@/hooks/use-latest-revision'
import { useArticle, ArticleProvider } from '@/contexts/article-context'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'
import { Image as ImageIcon, Plus, Trash2, Save, Video, MapPin, Type as TypeIcon, Upload, ArrowLeft, LogOut, GripVertical, Brain, Loader2, Heading1, Quote, Pin as PinIcon, FileText, Quote as QuoteIcon, Code, ChevronLeft, ChevronRight, MoreHorizontal, Copy, MessageCircle, Eye, EyeOff, Archive, BookOpen } from 'lucide-react'
import { AgentChat } from '@/components/agent/agent-chat'
import { AuthorSelector } from '@/components/author'
import { CategorySelector } from '@/components/category'
import { ImageGallery } from '@/components/image'
import { NotificationBell } from '@/components/notification'
import { TeamBlogSelector } from '@/components/team-blog'
import { RevisionPopover, UnpublishedChangesBanner, RevertConfirmationBanner } from '@/components/revisions'
import { CodeEditor } from '@/components/ui/code-editor'
import { UserAvatar } from '@/components/user-avatar'
import { useTeamBlog } from '@/hooks/use-team-blog'
import { OnboardingJourney } from '@/components/onboarding'
import { TeamBlogProvider, useTeamBlogContext } from '@/contexts/team-blog-context'
import { useDebugMode } from '@/contexts/debug-context'
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
                <Dashboard userId={userId} user={user} />
            </div>
        </TeamBlogProvider>
    )
}

function Header({ userId, onSignOut, user }: { userId: string; onSignOut: () => void; user: any }) {
    const { isDebugMode, toggleDebugMode } = useDebugMode()
    
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
                    {import.meta.env.DEV && (
                        <button
                            onClick={toggleDebugMode}
                            className={`p-2 rounded-md transition-colors ${
                                isDebugMode 
                                    ? 'bg-purple-50/90 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 backdrop-blur-sm' 
                                    : 'hover:bg-foreground/5'
                            }`}
                            title={`Debug Mode ${isDebugMode ? 'ON' : 'OFF'} (Cmd+. or Ctrl+.)`}
                        >
                            <Code className="h-4 w-4" />
                        </button>
                    )}
                    <Link 
                        to="/docs" 
                        className="p-2 rounded-md hover:bg-foreground/5 transition-colors"
                        title="Documentation"
                    >
                        <BookOpen className="h-4 w-4 text-foreground/70 hover:text-foreground" />
                    </Link>
                    <NotificationBell userId={userId} />
                    <UserAvatar user={user} onSignOut={onSignOut} />
                </div>
            </div>
        </header>
    )
}

function Dashboard({ userId, user }: { userId: string; user: any }) {
    const search = useSearch({ strict: false }) as { articleId?: string }
    const navigate = useNavigate()
    const { currentBlog } = useTeamBlogContext()
    const editingId = search?.articleId || null

    if (editingId) {
        return (
            <main className="flex-1">
                <div className="px-12 py-6">
                    <ArticleProvider articleId={editingId}>
                        <ArticleEditor key={editingId} articleId={editingId} userId={userId} user={user} onBack={() => navigate({ to: '/dashboard', search: {} })} />
                    </ArticleProvider>
                </div>
            </main>
        )
    }

    return <ArticlesList key={currentBlog?.$id || 'no-blog'} userId={userId} user={user} />
}

function EmptyArticlesState({ currentBlog, userId, user }: { currentBlog: any; userId: string; user: any }) {
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
                                status: 'draft',
                                subtitle: null,
                                images: null,
                                body: null,
                                authors: null,
                                live: false,
                                pinned: false,
                                redirect: null,
                                categories: null,
                                createdBy: userId,
                                slug: null,
                                blogId: currentBlog?.$id || null,
                                activeRevisionId: null, // Will be set after revision creation
                            }
                            const article = await db.articles.create(payload, currentTeam?.$id)
                            
                            // Create initial revision with user info
                            const userInfo = {
                                userId: user.$id,
                                userName: user.name || '',
                                userEmail: user.email || ''
                            }
                            const revision = await createInitialRevision(article, currentTeam?.$id, userInfo)
                            
                            // Update article with revision ID
                            await db.articles.update(article.$id, { activeRevisionId: revision.$id })
                            
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

function ArticlesList({ userId, user }: { userId: string; user: any }) {
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
            // For articles list, we need to fetch the article since we don't have shared state here
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
                                    {a.status === 'draft' && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white text-black border border-black/20">
                                            Draft
                                        </span>
                                    )}
                                    {a.status === 'archive' && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white text-black border border-black/20">
                                            Archive
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
                <OnboardingJourney 
                  articleCount={articleList?.total || 0}
                  onCreateArticle={async () => {
                    try {
                      const payload: Omit<Articles, keyof Models.Document> = {
                        trailer: null,
                        title: 'Untitled',
                        status: 'draft',
                        subtitle: null,
                        images: null,
                        body: null,
                        authors: null,
                        live: false,
                        pinned: false,
                        redirect: null,
                        categories: null,
                        createdBy: userId,
                        slug: null,
                        blogId: currentBlog?.$id || null,
                        activeRevisionId: null, // Will be set after revision creation
                      }
                      const article = await db.articles.create(payload, currentTeam?.$id)
                      
                      // Create initial revision with user info
                      const userInfo = {
                        userId: user.$id,
                        userName: user.name || '',
                        userEmail: user.email || ''
                      }
                      const revision = await createInitialRevision(article, currentTeam?.$id, userInfo)
                      
                      // Update article with revision ID
                      await db.articles.update(article.$id, { activeRevisionId: revision.$id })
                      
                      navigate({ to: '/dashboard', search: { articleId: article.$id } })
                    } catch (error) {
                      toast({
                        title: 'Error',
                        description: 'Failed to create article. Please try again.',
                        variant: 'destructive',
                      })
                    }
                  }}
                  onInviteTeam={() => {
                    // TODO: Implement team invitation functionality
                    toast({
                      title: 'Team Invitation',
                      description: 'Team invitation feature coming soon!',
                    })
                  }}
                  onShareOnX={() => {
                    const tweetText = "Just started using @CortextApp for AI-powered content management! 🚀 The flexible blocks and team collaboration features are amazing. #ContentManagement #AI"
                    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`
                    window.open(tweetUrl, '_blank', 'noopener,noreferrer')
                  }}
                />
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
                                    status: 'draft',
                                    subtitle: null,
                                    images: null,
                                    body: null,
                                    authors: null,
                                    live: false,
                                    pinned: false,
                                    redirect: null,
                                    categories: null,
                                    createdBy: userId,
                                    slug: null,
                                    blogId: currentBlog?.$id || null,
                                    activeRevisionId: null, // Will be set after revision creation
                                }
                                const article = await db.articles.create(payload, currentTeam?.$id)
                                
                                // Create initial revision with user info
                                const userInfo = {
                                    userId: user.$id,
                                    userName: user.name || '',
                                    userEmail: user.email || ''
                                }
                                const revision = await createInitialRevision(article, currentTeam?.$id, userInfo)
                                
                                // Update article with revision ID
                                await db.articles.update(article.$id, { activeRevisionId: revision.$id })
                                
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
                    <EmptyArticlesState currentBlog={currentBlog} userId={userId} user={user} />
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
                status: 'draft',
                subtitle: null,
                images: null,
                body: null,
                authors: authors.length > 0 ? authors : null,
                live: live,
                pinned: false,
                redirect: redirect.trim() || null,
                categories: categories.length > 0 ? categories : null,
                createdBy: userId,
                slug: null,
                blogId: currentBlog?.$id || null,
                activeRevisionId: null, // Will be set after revision creation
            }
            const article = await db.articles.create(payload, currentTeam?.$id)
            
            // Create initial revision
            const revision = await createInitialRevision(article, currentTeam?.$id)
            
            // Update article with revision ID
            await db.articles.update(article.$id, { activeRevisionId: revision.$id })
            
            return article
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
                            <Input id="new-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Article title" className="pr-20" />
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

function ArticleEditor({ articleId, userId, user, onBack }: { articleId: string; userId: string; user: any; onBack: () => void }) {
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const qc = useQueryClient()
    
    const scrollToTop = () => {
        const container = document.querySelector('.h-dvh.overflow-y-auto')
        if (container) {
            container.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }
    const navigate = useNavigate()
    const { currentBlog, currentTeam } = useTeamBlogContext()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [showReleaseConfirm, setShowReleaseConfirm] = useState(false)
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

    const { article, formData: latestFormData, hasUnpublishedChanges, latestRevision, isLoading: isLoadingRevision } = useLatestRevision(articleId)
    const { updateArticle } = useArticle()
    const isPending = isLoadingRevision

    // Manual save functionality
    const [isSaving, setIsSaving] = useState(false)

    // Helper function to get descriptive version name
    const getRevisionVersionName = (revision: any) => {
        if (!revision) return 'Unknown'
        
        const truncate = (text: string, maxLength: number = 30) => {
            return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
        }

        if (revision.isInitial) {
            return `Version ${revision.version} - Initial`
        }
        
        const changes = revision.changes || []
        if (changes.length === 0) return `Version ${revision.version}`
        
        // Get the first meaningful change
        const firstChange = changes[0]
        if (firstChange.includes('Updated title:')) {
            const titleChange = firstChange.split('Updated title: ')[1]
            const newTitle = titleChange.split(' → ')[1] || titleChange
            return `Version ${revision.version} - Title: ${truncate(newTitle, 20)}`
        }
        if (firstChange.includes('Section')) {
            const sectionInfo = firstChange.split(': ')[0]
            return `Version ${revision.version} - ${truncate(sectionInfo, 25)}`
        }
        if (firstChange.includes('Updated')) {
            const field = firstChange.split('Updated ')[1].split(':')[0]
            return `Version ${revision.version} - Updated ${truncate(field, 20)}`
        }
        
        return `Version ${revision.version}`
    }

    // Debug latest revision data
    useEffect(() => {
        // Debug information removed for production
    }, [latestRevision, latestFormData, isLoadingRevision])

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
    // Memoize comment targets to prevent unnecessary re-computations
    const commentTargets = useMemo(() => [
        { type: 'trailer' },
        { type: 'title' },
        { type: 'subtitle' },
        { type: 'redirect' },
        ...(localSections?.map(section => ({ type: 'section', id: section.id })) || [])
    ], [localSections])

    const { getCommentCount } = useCommentCounts(
        articleId,
        currentBlog?.$id || '',
        commentTargets
    )

    // Memoize comment counts to prevent expensive recalculations on every render
    const trailerCommentCount = useMemo(() => getCommentCount('trailer'), [getCommentCount])
    const titleCommentCount = useMemo(() => getCommentCount('title'), [getCommentCount])
    const subtitleCommentCount = useMemo(() => getCommentCount('subtitle'), [getCommentCount])
    const redirectCommentCount = useMemo(() => getCommentCount('redirect'), [getCommentCount])

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


    // Track a newly created section to focus its first relevant input when it renders
    const focusTargetRef = useRef<{ id: string; type: string } | null>(null)

    const updateArticleMutation = useMutation({
        mutationFn: async (data: Partial<Omit<Articles, keyof Models.Document>>) => {
            // Use shared state article data
            if (!article) {
                throw new Error('Article not found in shared state')
            }
            if (article.createdBy !== userId) throw new Error('Forbidden')
            
            // Update the article
            const updatedArticle = await db.articles.update(articleId, sanitizeArticleUpdate(data))
            
            return updatedArticle
        },
        onSuccess: (updatedArticle) => {
            // Update the article cache directly to prevent race conditions
            qc.setQueryData(['article', articleId], (oldData: any) => {
                if (!oldData) return oldData
                return {
                    ...oldData,
                    ...updatedArticle,
                    $updatedAt: new Date().toISOString()
                }
            })
            // Only invalidate the articles list for the list view
            qc.invalidateQueries({ queryKey: ['articles', userId, currentBlog?.$id] })
        },
        onError: () => toast({ title: 'Failed to save article' }),
    })

    const deleteArticle = useMutation({
        mutationFn: async () => {
            // Use shared state article data
            if (!article) {
                throw new Error('Article not found in shared state')
            }
            if (article.createdBy !== userId) throw new Error('Forbidden')
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
            // Use shared state article data
            if (!article) {
                throw new Error('Article not found in shared state')
            }
            if (article.createdBy !== userId) throw new Error('Forbidden')
            
            // Create a copy of the article with a new ID
            const duplicateData: Omit<Articles, keyof Models.Document> = {
                trailer: article.trailer,
                title: `${article.title} (Copy)`,
                status: 'draft', // Always create as draft
                subtitle: article.subtitle,
                images: article.images,
                body: article.body, // Copy all sections
                authors: article.authors,
                live: false, // Always create as not live
                pinned: false, // Don't copy pin status
                redirect: article.redirect,
                categories: article.categories,
                createdBy: userId,
                slug: null, // Will be generated from title
                blogId: article.blogId,
                activeRevisionId: null, // Will be set after revision creation
            }
            
            const newArticle = await db.articles.create(duplicateData, currentTeam?.$id)
            
            // Create initial revision with user info
            const userInfo = {
                userId: user.$id,
                userName: user.name || '',
                userEmail: user.email || ''
            }
            const revision = await createInitialRevision(article, currentTeam?.$id, userInfo)
            
            // Update article with revision ID
            await db.articles.update(article.$id, { activeRevisionId: revision.$id })
            
            return article
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
                    textContent = section.caption || ''
                    // Count actual selected images, not just image sections
                    const imageIds = section.imageIds || (section.mediaId ? [section.mediaId] : [])
                    totalAssets += imageIds.length
                    break
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
        
        // Get the appropriate input ID for the section type
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
    
    // Revert state
    const [selectedRevisionId, setSelectedRevisionId] = useState<string | null>(null)
    const [showRevertConfirmation, setShowRevertConfirmation] = useState(false)
    const [isReverting, setIsReverting] = useState(false)
    const [revertFormData, setRevertFormData] = useState<any>(null)
    const [isInRevertMode, setIsInRevertMode] = useState(false)
    const isRevertingRef = useRef(false)

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
    const subtitleRef = useRef<HTMLTextAreaElement | null>(null)
    const [live, setLive] = useState(false)
    const [redirect, setRedirect] = useState('')
    const [authors, setAuthors] = useState<string[]>([])
    const [categories, setCategories] = useState<string[]>([])
    const [status, setStatus] = useState('draft')
    const [saving, setSaving] = useState(false)
    const { isDebugMode: showDebug, setDebugMode: setShowDebug, toggleDebugMode } = useDebugMode()
    const [bannerWasVisible, setBannerWasVisible] = useState(false)
    const [isInitialLoad, setIsInitialLoad] = useState(true)
    const [hasUserInteracted, setHasUserInteracted] = useState(false)
    
    // Debug wrapper for hasUserInteracted
    const setHasUserInteractedDebug = useCallback((value: boolean, reason: string) => {
        setHasUserInteracted(value)
    }, [hasUserInteracted])
    const [isDataLoaded, setIsDataLoaded] = useState(false)
    const [isFullyLoaded, setIsFullyLoaded] = useState(false)
    const [initialSections, setInitialSections] = useState<any[]>([])
    const [hasChanges, setHasChanges] = useState(false)

    // Manual save function
    const handleSave = useCallback(async () => {
        if (isSaving) return
        
        setIsSaving(true)
        try {
            const articleData = {
                title,
                subtitle,
                trailer,
                status,
                live,
                pinned: article?.pinned || false,
                redirect,
                slug: slugify(title),
                authors,
                categories,
                images: article?.images || null,
                blogId: article?.blogId || null,
                body: JSON.stringify(localSections),
                createdBy: article?.createdBy || userId,
            }
            
            // Create revision
            const revision = await createUpdateRevision(
                articleId,
                article || {} as Articles,
                articleData as Articles,
                currentTeam?.$id,
                undefined,
                { 
                    userId, 
                    userName: user?.name || '', 
                    userEmail: user?.email || '' 
                }
            )

            if (revision) {
                // Update the article
                await db.articles.update(articleId, {
                    ...articleData,
                    activeRevisionId: revision.$id
                })
                
                // Update cache
                qc.setQueryData(['article', articleId], (oldData: any) => {
                    if (!oldData) return oldData
                    return {
                        ...oldData,
                        ...articleData,
                        activeRevisionId: revision.$id,
                        $updatedAt: new Date().toISOString()
                    }
                })

                // Invalidate related queries
                qc.invalidateQueries({ queryKey: ['articles'] })
                qc.invalidateQueries({ queryKey: ['latest-revision', articleId] })
                qc.invalidateQueries({ queryKey: ['revisions', articleId] })
                
                setHasChanges(false)
                toast({ title: 'Article saved successfully' })
            }
        } catch (error) {
            console.error('Save failed:', error)
            toast({ 
                title: 'Save failed', 
                description: error instanceof Error ? error.message : 'Unknown error',
                variant: 'destructive'
            })
        } finally {
            setIsSaving(false)
        }
    }, [isSaving, title, subtitle, trailer, status, live, redirect, authors, categories, localSections, article, userId, currentTeam?.$id, user, qc, articleId])

    // Reset hasUserInteracted when save successfully saves changes
    useEffect(() => {
        if (!isSaving && hasUserInteracted && !hasChanges) {
            setHasUserInteractedDebug(false, 'save completed')
        }
    }, [isSaving, hasUserInteracted, hasChanges, setHasUserInteractedDebug])

    // Track the last processed revision ID to detect new revisions
    const [lastProcessedRevisionId, setLastProcessedRevisionId] = useState<string | null>(null)
    
    // Load sections from server data
    useEffect(() => {
        // Allow updates if this is a new revision (revision ID changed)
        const isNewRevision = latestFormData?.activeRevisionId && latestFormData.activeRevisionId !== lastProcessedRevisionId
        
        if (latestFormData?.body && (isNewRevision || !isDataLoaded)) {
            try {
                const sections = JSON.parse(latestFormData.body)
                const parsedSections = Array.isArray(sections) ? sections : []
                
                setLocalSections(parsedSections)
                // Store initial sections for comparison
                setInitialSections(parsedSections)
                
                // Update the last processed revision ID
                if (latestFormData.activeRevisionId) {
                    setLastProcessedRevisionId(latestFormData.activeRevisionId)
                }
            } catch (error) {
                setLocalSections([])
                setInitialSections([])
            }
            // Mark data as loaded after sections are loaded
            setIsDataLoaded(true)
        }
    }, [latestFormData?.$id, latestFormData?.body, latestFormData?.$updatedAt, latestFormData?.activeRevisionId, lastProcessedRevisionId, isDataLoaded]) // Update when revision ID changes


    // Section management functions
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
        setHasChanges(true)
        setHasUserInteracted(true)
        // Focus the first input after the component re-renders
        focusTargetRef.current = { id: newSection.id, type: String(type) }
    }

    const updateSection = useCallback((id: string, data: any) => {
        setLocalSections(prev => {
            const updated = prev.map(section => 
                section.id === id ? { ...section, ...data } : section
            )
            return updated
        })
        setHasChanges(true)
        setHasUserInteracted(true)
    }, [])

    // Create onLocalChange handler that doesn't depend on localSections
    const createOnLocalChangeHandler = useCallback((sectionId: string) => {
        return (patch: any) => updateSection(sectionId, patch)
    }, [updateSection])


    const deleteSection = (id: string) => {
        setLocalSections(prev => prev.filter(section => section.id !== id))
        // Only set hasUserInteracted if we're not in initial load
        if (isFullyLoaded) {
            setHasUserInteractedDebug(true, 'deleteSection')
        }
    }

    const persistOrder = (next: any[]) => {
        const updatedSections = next.map((s, i) => ({ ...s, position: i }))
        setLocalSections(updatedSections)
        // Only set hasUserInteracted if we're not in initial load
        if (isFullyLoaded) {
            setHasUserInteractedDebug(true, 'persistOrder')
        }
    }



    const handleStatusChange = useCallback((newStatus: string) => {
        setStatus(newStatus)
        setHasChanges(true)
        setHasUserInteracted(true)
    }, [])

    // Wrapper functions to track user interaction
    const handleTrailerChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setTrailer(e.target.value)
        setHasChanges(true)
        setHasUserInteracted(true)
    }, [])

    const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value)
        setHasChanges(true)
        setHasUserInteracted(true)
    }, [])

    // Function to adjust subtitle textarea height
    const adjustSubtitleHeight = useCallback(() => {
        if (!subtitleRef.current) return
        subtitleRef.current.style.height = 'auto'
        subtitleRef.current.style.height = subtitleRef.current.scrollHeight + 'px'
    }, [])

    // Adjust subtitle height when content changes
    useEffect(() => {
        const frameId = requestAnimationFrame(() => {
            adjustSubtitleHeight()
            setTimeout(adjustSubtitleHeight, 0)
        })
        return () => cancelAnimationFrame(frameId)
    }, [subtitle, adjustSubtitleHeight])

    const handleSubtitleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setExcerpt(e.target.value)
        setHasChanges(true)
        setHasUserInteracted(true)
    }, [])

    const handleLiveChange = useCallback((checked: boolean) => {
        setLive(checked)
        setHasChanges(true)
        setHasUserInteracted(true)
    }, [])

    const handleRedirectChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setRedirect(e.target.value)
        setHasChanges(true)
        setHasUserInteracted(true)
    }, [])

    const handleAuthorsChange = useCallback((authors: string[]) => {
        setAuthors(authors)
        setHasChanges(true)
        setHasUserInteracted(true)
    }, [])

    const handleCategoriesChange = useCallback((categories: string[]) => {
        setCategories(categories)
        setHasChanges(true)
        setHasUserInteracted(true)
    }, [])

    // Memoized selectors to prevent unnecessary re-renders
    const memoizedAuthorSelector = useMemo(() => (
        <AuthorSelector 
            selectedAuthorIds={authors}
            onAuthorsChange={isInRevertMode ? () => {} : handleAuthorsChange}
            userId={userId}
            disabled={isInRevertMode}
        />
    ), [authors, handleAuthorsChange, userId, isInRevertMode])

    const memoizedCategorySelector = useMemo(() => (
        <CategorySelector 
            selectedCategoryIds={categories}
            onCategoriesChange={isInRevertMode ? () => {} : handleCategoriesChange}
            userId={userId}
            disabled={isInRevertMode}
        />
    ), [categories, handleCategoriesChange, userId, isInRevertMode])

    // Track when banner becomes visible to prevent hiding during save
    useEffect(() => {
        if (hasUnpublishedChanges && !saving) {
            setBannerWasVisible(true)
        } else if (!hasUnpublishedChanges && !saving) {
            setBannerWasVisible(false)
        }
    }, [hasUnpublishedChanges, saving])

    useEffect(() => {
        if (!latestFormData || isRevertingRef.current) {
            return
        }
        
        // Allow updates if this is a new revision (revision ID changed) OR if data hasn't been loaded yet
        const isNewRevision = latestFormData?.activeRevisionId && latestFormData.activeRevisionId !== lastProcessedRevisionId
        
        if (latestFormData) {
            // Always load form data when latestFormData is available
            setTrailer(latestFormData.trailer ?? '')
            setTitle(latestFormData.title ?? '')
            setExcerpt(latestFormData.subtitle ?? '')
            setLive(latestFormData.live ?? false)
            setRedirect(latestFormData.redirect ?? '')
            setAuthors(latestFormData.authors ?? [])
            setCategories(latestFormData.categories ?? [])
            setStatus(latestFormData.status ?? 'draft')
            
            // Update the last processed revision ID
            if (latestFormData.activeRevisionId) {
                setLastProcessedRevisionId(latestFormData.activeRevisionId)
            }
        }
    }, [latestFormData?.$id, latestFormData?.$updatedAt, latestFormData?.body, latestFormData?.title, latestFormData?.subtitle, latestFormData?.activeRevisionId, lastProcessedRevisionId, isDataLoaded]) // Update when revision ID changes


    // Set fully loaded state after all data is loaded and settled
    useEffect(() => {
        if (isDataLoaded && latestFormData) {
            // Add a small delay to ensure all data is settled
            const timer = setTimeout(() => {
                setIsFullyLoaded(true)
                // Don't set hasUserInteracted here - only set it when user actually makes changes
            }, 200)
            return () => clearTimeout(timer)
        }
    }, [isDataLoaded, latestFormData])






    // Set document title based on article title
    useDocumentTitle(title || 'Editor')
    



    const handleDeploy = () => {
        // Show confirmation dialog first
        setShowReleaseConfirm(true)
    }

    const confirmRelease = async () => {
        try {
            setSaving(true)
            setShowReleaseConfirm(false)
            
            // Update status to publish before releasing
            setStatus('publish')
            
            // First, save current changes as a revision
            const currentFormData = {
                trailer,
                title, 
                slug: slugify(title), 
                subtitle,
                live,
                redirect,
                authors,
                categories,
                body: JSON.stringify(localSections),
                status: 'publish', // Use publish status
                pinned: article?.pinned || false,
                images: article?.images || null,
                blogId: article?.blogId || null,
                createdBy: article?.createdBy || userId,
            }
            
            // Create revision with deployed data
            const revision = await createUpdateRevision(
                articleId, 
                article!, 
                currentFormData as Articles, 
                currentTeam?.$id
            )
            
            if (revision) {
                // Update the article with the latest revision data AND set as deployed
                await updateArticleMutation.mutateAsync({ 
                    trailer,
                    title, 
                    slug: slugify(title), 
                    subtitle,
                    live,
                    redirect,
                    authors,
                    categories,
                    body: JSON.stringify(localSections),
                    status: 'publish', // Use publish status
                    activeRevisionId: revision.$id
                })
                
                // Mark the revision as deployed
                await db.revisions.update(revision.$id, { 
                    status: 'publish'
                })
                
                // Invalidate queries to refresh the data
                qc.invalidateQueries({ queryKey: ['article', articleId] })
                qc.invalidateQueries({ queryKey: ['latest-revision', articleId] })
                qc.invalidateQueries({ queryKey: ['revisions', articleId] })
                
                toast({ title: 'Article released successfully' })
            } else {
                toast({ title: 'No changes to release' })
            }
        } catch (e) {
            console.error('Release error:', e)
            toast({ 
                title: 'Failed to release article', 
                description: e instanceof Error ? e.message : 'Unknown error',
                variant: 'destructive'
            })
        } finally {
            setSaving(false)
        }
    }

    // Handle reverting to a specific revision
    // Handle AI revision application
    const handleApplyAIRevision = async (revisionId: string) => {
        
        try {
            // Disable data loading temporarily during AI revision application
            isRevertingRef.current = true
            
            // Force refetch of all related queries to ensure we get the latest data
            await Promise.all([
                qc.refetchQueries({ queryKey: ['revisions', articleId] }),
                qc.refetchQueries({ queryKey: ['article', articleId] }),
                qc.refetchQueries({ queryKey: ['latestRevision', articleId] })
            ])

            // Force form to reload by resetting the data loaded state
            setIsDataLoaded(false)
            setLastProcessedRevisionId(null) // Reset to force detection of new revision
            
            // Clear any cached data when LLM creates new revision
            
            
        } catch (error) {
            console.error('❌ Error applying AI revision:', error)
        } finally {
            // Re-enable data loading after a short delay
            setTimeout(() => {
                isRevertingRef.current = false
            }, 1000)
        }
    }

    const handleRevertToRevision = async (revisionId: string) => {
        try {
            setIsReverting(true)
            isRevertingRef.current = true
            
            // Get the revision data
            const revision = await db.revisions.get(revisionId)
            if (!revision) {
                throw new Error('Revision not found')
            }
            
            const revisionData = JSON.parse(revision.data)
            const revisionAttributes = revisionData.attributes || revisionData
            
            // Create a new revision with the reverted data
            const revertedFormData = {
                ...article,
                title: revisionAttributes.title ?? article?.title,
                subtitle: revisionAttributes.subtitle ?? article?.subtitle,
                trailer: revisionAttributes.trailer ?? article?.trailer,
                status: revisionAttributes.status ?? article?.status,
                live: revisionAttributes.live ?? article?.live,
                pinned: revisionAttributes.pinned ?? article?.pinned,
                redirect: revisionAttributes.redirect ?? article?.redirect,
                slug: revisionAttributes.slug ?? article?.slug,
                authors: revisionAttributes.authors ?? article?.authors,
                categories: revisionAttributes.categories ?? article?.categories,
                images: revisionAttributes.images ?? article?.images,
                blogId: revisionAttributes.blogId ?? article?.blogId,
                body: revisionAttributes.sections ? JSON.stringify(revisionAttributes.sections) : article?.body,
            }
            
            // Create a new revision with the reverted data
            const newRevision = await createRevertRevision(
                articleId,
                article!,
                revertedFormData as Articles,
                currentTeam?.$id,
                `Reverted to version ${revision.version}`
            )
            
            if (newRevision) {
                // Don't update the article's activeRevisionId - that only happens on deploy
                // The form will show the reverted data, but the article stays pointing to the published version
                
                // Update form state with reverted data
                setTitle(revisionAttributes.title ?? article?.title ?? '')
                setExcerpt(revisionAttributes.subtitle ?? article?.subtitle ?? '')
                setTrailer(revisionAttributes.trailer ?? article?.trailer ?? '')
                setLive(revisionAttributes.live ?? article?.live ?? false)
                setRedirect(revisionAttributes.redirect ?? article?.redirect ?? '')
                setAuthors(revisionAttributes.authors ?? article?.authors ?? [])
                setCategories(revisionAttributes.categories ?? article?.categories ?? [])
                
                // Update sections
                if (revisionAttributes.sections) {
                    setLocalSections(revisionAttributes.sections)
                }
                
                // Clear revert state
                setSelectedRevisionId(null)
                setShowRevertConfirmation(false)
                setRevertFormData(null)
                setIsInRevertMode(false)
                
                // Invalidate only the revisions query to refresh the revision list
                qc.invalidateQueries({ queryKey: ['revisions', articleId] })
                
                toast({ title: `Reverted to version ${revision.version}` })
            } else {
                console.error('Failed to create new revision')
            }
        } catch (error) {
            console.error('Revert error:', error)
            toast({
                title: 'Failed to revert revision',
                description: error instanceof Error ? error.message : 'Unknown error',
                variant: 'destructive'
            })
        } finally {
            setIsReverting(false)
            isRevertingRef.current = false
            
            // Clear any cached data when reverting to prevent interference
        }
    }

    // Handle selecting a revision for revert
    const handleSelectRevisionForRevert = async (revisionId: string) => {
        try {
            const revision = await db.revisions.get(revisionId)
            if (!revision) {
                return
            }
            
            const revisionData = JSON.parse(revision.data)
            const revisionAttributes = revisionData.attributes || revisionData
            
            // Set the selected revision and show confirmation
            setSelectedRevisionId(revisionId)
            const revertData = {
                title: revisionAttributes.title ?? article?.title,
                subtitle: revisionAttributes.subtitle ?? article?.subtitle,
                version: revision.version,
                timestamp: revision.$createdAt
            }
            setRevertFormData(revertData)
            setShowRevertConfirmation(true)
            
            // Load revision data into form and enable read-only mode
            setTitle(revisionAttributes.title ?? article?.title ?? '')
            setExcerpt(revisionAttributes.subtitle ?? article?.subtitle ?? '')
            setTrailer(revisionAttributes.trailer ?? article?.trailer ?? '')
            setLive(revisionAttributes.live ?? article?.live ?? false)
            setRedirect(revisionAttributes.redirect ?? article?.redirect ?? '')
            setAuthors(revisionAttributes.authors ?? article?.authors ?? [])
            setCategories(revisionAttributes.categories ?? article?.categories ?? [])
            
            // Update sections
            if (revisionAttributes.sections) {
                setLocalSections(revisionAttributes.sections)
            }
            
            // Disable data loading by setting the revert flag
            isRevertingRef.current = true
            setIsInRevertMode(true)
            
        } catch (error) {
            console.error('Error loading revision:', error)
            toast({
                title: 'Failed to load revision',
                description: error instanceof Error ? error.message : 'Unknown error',
                variant: 'destructive'
            })
        }
    }

    // Handle canceling revert
    const handleCancelRevert = () => {
        // Restore original form data
        if (latestFormData) {
            setTitle(latestFormData.title ?? '')
            setExcerpt(latestFormData.subtitle ?? '')
            setTrailer(latestFormData.trailer ?? '')
            setLive(latestFormData.live ?? false)
            setRedirect(latestFormData.redirect ?? '')
            setAuthors(latestFormData.authors ?? [])
            setCategories(latestFormData.categories ?? [])
            
            // Restore sections
            if (latestFormData.body) {
                try {
                    const sections = JSON.parse(latestFormData.body)
                    const parsedSections = Array.isArray(sections) ? sections : []
                    setLocalSections(parsedSections)
                } catch (error) {
                    console.error('Error parsing sections:', error)
                }
            }
        }
        
        // Clear revert state
        setSelectedRevisionId(null)
        setShowRevertConfirmation(false)
        setRevertFormData(null)
        setIsInRevertMode(false)
        
        // Re-enable data loading
        isRevertingRef.current = false
    }

    if (isPending || !article) {
        return <div className="text-sm text-muted-foreground">Loading…</div>
    }

    return (
        <>
            <AgentChat 
                title={title} 
                subtitle={subtitle} 
                onSetTitle={setTitle} 
                onSetSubtitle={setExcerpt}
                articleId={articleId}
                blogId={currentBlog?.$id}
                onApplyAIRevision={handleApplyAIRevision}
                debugMode={showDebug}
            />
            <div className="px-6 pt-2 pb-2 ml-0 md:ml-[18rem] lg:ml-[20rem] xl:ml-[24rem]">
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

            {/* Sticky banners at the top */}
            <div className="sticky top-16 z-10 px-6 py-3 ml-0 md:ml-[18rem] lg:ml-[20rem] xl:ml-[24rem]">
                {/* Unpublished changes banner */}
                {!isInRevertMode && (
                    <div className={`transition-all duration-500 ease-out ${
                        ((hasUnpublishedChanges && !saving) || (bannerWasVisible && saving)) 
                            ? 'opacity-100 translate-y-0 mb-3' 
                            : 'opacity-0 -translate-y-2 h-0 mb-0 overflow-hidden'
                    }`}>
                        <UnpublishedChangesBanner 
                            onSave={handleDeploy}
                            isSaving={saving}
                        />
                    </div>
                )}

                {/* Revert confirmation banner */}
                {showRevertConfirmation && revertFormData && (
                    <div className="mb-3 transition-all duration-500 ease-out">
                        <RevertConfirmationBanner
                            revisionTitle={`Version ${revertFormData.version} - ${revertFormData.title}`}
                            revisionDate={revertFormData.timestamp}
                            onConfirm={() => {
                                if (selectedRevisionId) {
                                    handleRevertToRevision(selectedRevisionId)
                                } else {
                                    console.error('No selectedRevisionId when clicking revert')
                                }
                            }}
                            onCancel={handleCancelRevert}
                            isReverting={isReverting}
                        />
                    </div>
                )}
            </div>

            <div className="flex justify-center px-6 py-6 pb-24 ml-0 md:ml-[18rem] lg:ml-[20rem] xl:ml-[24rem]">
                <div className="w-full max-w-3xl space-y-8">

                {/* Debug panel */}
                {showDebug && (
                    <div className="mb-6 p-4 bg-purple-50/90 dark:bg-purple-950/50 backdrop-blur-sm rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                                Debug
                                {latestRevision && (
                                    <span className="ml-2 text-xs font-normal text-purple-600 dark:text-purple-300">
                                        v{latestRevision.version}
                                    </span>
                                )}
                            </h3>
                            <button 
                                onClick={() => setShowDebug(false)}
                                className="text-xs text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200"
                            >
                                ×
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                                <div className="font-medium text-purple-700 dark:text-purple-300 mb-1">Status</div>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className="flex items-center gap-1">
                                            Unpublished Changes
                                            <div className="group relative">
                                                <span className="text-purple-500 dark:text-purple-400 cursor-help text-xs w-3 h-3 rounded-full border border-current flex items-center justify-center text-[8px]">i</span>
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                                    Changes that haven't been published to the live article yet
                                                </div>
                                            </div>
                                        </span>
                                        <span className={hasUnpublishedChanges ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}>
                                            {hasUnpublishedChanges ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="flex items-center gap-1">
                                            Save Status
                                        </span>
                                        <span className={`font-mono ${
                                            isSaving ? 'text-blue-600 dark:text-blue-400' :
                                            'text-gray-600 dark:text-gray-400'
                                        }`}>
                                            {isSaving ? 'Saving...' : 'Ready'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="flex items-center gap-1">
                                            Revert Mode
                                            <div className="group relative">
                                                <span className="text-purple-500 dark:text-purple-400 cursor-help text-xs w-3 h-3 rounded-full border border-current flex items-center justify-center text-[8px]">i</span>
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                                    Whether you're currently viewing a previous version of the article
                                                </div>
                                            </div>
                                        </span>
                                        <span className={isInRevertMode ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}>
                                            {isInRevertMode ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="font-medium text-purple-700 dark:text-purple-300 mb-1">Revisions</div>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className="flex items-center gap-1">
                                            Active
                                            <div className="group relative">
                                                <span className="text-purple-500 dark:text-purple-400 cursor-help text-xs w-3 h-3 rounded-full border border-current flex items-center justify-center text-[8px]">i</span>
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                                    The revision ID that's currently published and visible to readers
                                                </div>
                                            </div>
                                        </span>
                                        <span className="font-mono text-xs">
                                            {article?.activeRevisionId || 'None'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="flex items-center gap-1">
                                            Latest
                                            <div className="group relative">
                                                <span className="text-purple-500 dark:text-purple-400 cursor-help text-xs w-3 h-3 rounded-full border border-current flex items-center justify-center text-[8px]">i</span>
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                                    The most recent revision ID that exists in the database
                                                </div>
                                            </div>
                                        </span>
                                        <span className="font-mono text-xs">
                                            {latestRevision?.$id || 'None'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="flex items-center gap-1">
                                            Match
                                            <div className="group relative">
                                                <span className="text-purple-500 dark:text-purple-400 cursor-help text-xs w-3 h-3 rounded-full border border-current flex items-center justify-center text-[8px]">i</span>
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                                    Whether the active and latest revisions are the same (should be ✓ for normal operation)
                                                </div>
                                            </div>
                                        </span>
                                        <span className={article?.activeRevisionId === latestRevision?.$id ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}>
                                            {article?.activeRevisionId === latestRevision?.$id ? '✓' : '✗'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-3 pt-2">
                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-4">
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-3 pt-2 border-t border-purple-200 dark:border-purple-700">
                            <div className="font-medium text-purple-700 dark:text-purple-300 mb-2 flex items-center gap-1">
                                Save Status
                                <div className="group relative">
                                    <span className="text-purple-500 dark:text-purple-400 cursor-help text-xs w-3 h-3 rounded-full border border-current flex items-center justify-center text-[8px]">i</span>
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                        Debug information for manual save functionality
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className="flex items-center gap-1">
                                            Has Changes
                                            <div className="group relative">
                                                <span className="text-purple-500 dark:text-purple-400 cursor-help text-xs w-3 h-3 rounded-full border border-current flex items-center justify-center text-[8px]">i</span>
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                                    Whether user has made changes that need to be saved
                                                </div>
                                            </div>
                                        </span>
                                        <span className={hasChanges ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}>
                                            {hasChanges ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="flex items-center gap-1">
                                            Save Status
                                            <div className="group relative">
                                                <span className="text-purple-500 dark:text-purple-400 cursor-help text-xs w-3 h-3 rounded-full border border-current flex items-center justify-center text-[8px]">i</span>
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                                    Current state of the save process
                                                </div>
                                            </div>
                                        </span>
                                        <span className={`font-mono ${
                                            isSaving ? 'text-blue-600 dark:text-blue-400' :
                                            'text-gray-600 dark:text-gray-400'
                                        }`}>
                                            {isSaving ? 'Saving...' : 'Ready'}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className="flex items-center gap-1">
                                            User Interacted
                                            <div className="group relative">
                                                <span className="text-purple-500 dark:text-purple-400 cursor-help text-xs w-3 h-3 rounded-full border border-current flex items-center justify-center text-[8px]">i</span>
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                                    Whether the user has made any changes to the form
                                                </div>
                                            </div>
                                        </span>
                                        <span className={hasUserInteracted ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}>
                                            {hasUserInteracted ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="flex items-center gap-1">
                                            Fully Loaded
                                            <div className="group relative">
                                                <span className="text-purple-500 dark:text-purple-400 cursor-help text-xs w-3 h-3 rounded-full border border-current flex items-center justify-center text-[8px]">i</span>
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                                    Whether the component has finished loading all data
                                                </div>
                                            </div>
                                        </span>
                                        <span className={isFullyLoaded ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}>
                                            {isFullyLoaded ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-2 flex gap-2 flex-wrap">
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => {
                                        setHasChanges(true)
                                    }}
                                    className="h-6 px-2 text-xs text-purple-600 border-purple-300 hover:bg-purple-200 dark:text-purple-400 dark:border-purple-700 dark:hover:bg-purple-800"
                                >
                                    Trigger Changes
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => {
                                        setHasChanges(false)
                                    }}
                                    className="h-6 px-2 text-xs text-purple-600 border-purple-300 hover:bg-purple-200 dark:text-purple-400 dark:border-purple-700 dark:hover:bg-purple-800"
                                >
                                    Clear Changes
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={handleSave}
                                    disabled={isSaving || !hasChanges}
                                    className="h-6 px-2 text-xs text-purple-600 border-purple-300 hover:bg-purple-200 dark:text-purple-400 dark:border-purple-700 dark:hover:bg-purple-800"
                                >
                                    Manual Save
                                </Button>
                            </div>
                        </div>
                    </div>
                )}



                {/* Article meta form */}
                <section className="space-y-4">
                    <div>
                        <Label htmlFor="trailer">Trailer</Label>
                        {hideComments || isInRevertMode ? (
                            <Input id="trailer" value={trailer} onChange={handleTrailerChange} placeholder="Breaking news, Exclusive..." disabled={isInRevertMode} />
                        ) : (
                            <CommentableInput
                                articleId={articleId}
                                blogId={currentBlog?.$id || ''}
                                targetType="trailer"
                                commentCount={trailerCommentCount.count}
                                hasNewComments={trailerCommentCount.hasNewComments}
                            >
                                <Input id="trailer" value={trailer} onChange={handleTrailerChange} placeholder="Breaking news, Exclusive..." disabled={isInRevertMode} />
                            </CommentableInput>
                        )}
                    </div>
                    <div className="md:col-span-2">
                        <Label htmlFor="title">Title</Label>
                        <div className="relative">
                            {hideComments || isInRevertMode ? (
                                <Input 
                                    id="title" 
                                    value={title} 
                                    onChange={handleTitleChange} 
                                    placeholder="Article title" 
                                    className="pr-20" 
                                    disabled={isInRevertMode}
                                />
                            ) : (
                                <CommentableInput
                                    articleId={articleId}
                                    blogId={currentBlog?.$id || ''}
                                    targetType="title"
                                    commentCount={titleCommentCount.count}
                                    hasNewComments={titleCommentCount.hasNewComments}
                                >
                                    <Input 
                                        id="title" 
                                        value={title} 
                                        onChange={handleTitleChange} 
                                        placeholder="Article title" 
                                        className="pr-20" 
                                        disabled={isInRevertMode}
                                    />
                                </CommentableInput>
                            )}
                            <div className="absolute right-3 mr-2 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                                <Checkbox id="live" checked={live} onCheckedChange={(checked) => handleLiveChange(checked === true)} disabled={isInRevertMode} />
                                <Label htmlFor="live" className="text-xs text-muted-foreground inline-label">Live</Label>
                            </div>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="subtitle">Subtitle</Label>
                        {hideComments || isInRevertMode ? (
                            <Textarea 
                                id="subtitle" 
                                ref={subtitleRef}
                                value={subtitle} 
                                onChange={handleSubtitleChange} 
                                placeholder="Short summary (optional)" 
                                disabled={isInRevertMode} 
                                rows={1}
                                className="min-h-[40px] text-sm w-full min-w-0"
                                style={{ overflow: 'hidden', resize: 'none', width: '100%', maxWidth: '100%' }}
                            />
                        ) : (
                            <CommentableInput
                                articleId={articleId}
                                blogId={currentBlog?.$id || ''}
                                targetType="subtitle"
                                commentCount={subtitleCommentCount.count}
                                hasNewComments={subtitleCommentCount.hasNewComments}
                                className="items-start"
                            >
                                <Textarea 
                                    id="subtitle" 
                                    ref={subtitleRef}
                                    value={subtitle} 
                                    onChange={handleSubtitleChange} 
                                    placeholder="Short summary (optional)" 
                                    disabled={isInRevertMode} 
                                    rows={1}
                                    className="min-h-[40px] text-sm w-full min-w-0"
                                    style={{ overflow: 'hidden', resize: 'none', width: '100%', maxWidth: '100%' }}
                                />
                            </CommentableInput>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="status">Status</Label>
                        <Select value={status} onValueChange={handleStatusChange} disabled={isInRevertMode}>
                            <SelectTrigger>
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${
                                        status === 'unpublish' ? 'bg-gray-400' :
                                        status === 'publish' ? 'bg-green-500' :
                                        status === 'draft' ? 'bg-blue-500' :
                                        status === 'archive' ? 'bg-orange-500' :
                                        'bg-gray-300'
                                    }`} />
                                    <span className="text-sm">
                                        {status === 'publish' ? 'Publish' :
                                         status === 'draft' ? 'Draft' :
                                         status === 'archived' ? 'Archive' :
                                         'Select status'}
                                    </span>
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="publish">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-green-500" />
                                        <span>Publish</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="draft">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                                        <span>Draft</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="archive">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                                        <span>Archive</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="mt-6">
                        {memoizedAuthorSelector}
                    </div>
                    <div className="mt-6">
                        {memoizedCategorySelector}
                    </div>
                </section>

                {/* Sections composer */}
                <section className="space-y-4">
                    <div>
                        <h2 className="text-base font-medium mb-3">Sections</h2>
                        <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => createSection('title')} className="h-7 px-2 text-xs" disabled={isInRevertMode}><Heading1 className="h-3.5 w-3.5 mr-1" /> Title</Button>
                            <Button size="sm" variant="outline" onClick={() => createSection('text')} className="h-7 px-2 text-xs" disabled={isInRevertMode}><TypeIcon className="h-3.5 w-3.5 mr-1" /> Text</Button>
                            <Button size="sm" variant="outline" onClick={() => createSection('quote')} className="h-7 px-2 text-xs" disabled={isInRevertMode}><Quote className="h-3.5 w-3.5 mr-1" /> Quote</Button>
                            <Button size="sm" variant="outline" onClick={() => createSection('image')} className="h-7 px-2 text-xs" disabled={isInRevertMode}><ImageIcon className="h-3.5 w-3.5 mr-1" /> Image</Button>
                            <Button size="sm" variant="outline" onClick={() => createSection('code')} className="h-7 px-2 text-xs" disabled={isInRevertMode}><Code className="h-3.5 w-3.5 mr-1" /> Code</Button>
                            <Button size="sm" variant="outline" onClick={() => createSection('video')} className="h-7 px-2 text-xs" disabled={isInRevertMode}><Video className="h-3.5 w-3.5 mr-1" /> Video</Button>
                            <Button size="sm" variant="outline" onClick={() => createSection('map')} className="h-7 px-2 text-xs" disabled={isInRevertMode}><MapPin className="h-3.5 w-3.5 mr-1" /> Map</Button>
                        </div>
                    </div>

                    {(localSections?.length ?? 0) === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 px-4 text-center border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/5">
                            <h3 className="text-base font-medium text-foreground mb-2">No sections yet</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Add content sections to build your article.
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center">
                                <Button size="sm" variant="outline" onClick={() => createSection('title')} className="h-8 px-3 text-xs" disabled={isInRevertMode}>
                                    <Heading1 className="h-3.5 w-3.5 mr-1" /> Start with Title
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => createSection('text')} className="h-8 px-3 text-xs" disabled={isInRevertMode}>
                                    <TypeIcon className="h-3.5 w-3.5 mr-1" /> Add Text
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => createSection('image')} className="h-8 px-3 text-xs" disabled={isInRevertMode}>
                                    <ImageIcon className="h-3.5 w-3.5 mr-1" /> Add Image
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => createSection('code')} className="h-8 px-3 text-xs" disabled={isInRevertMode}>
                                    <Code className="h-3.5 w-3.5 mr-1" /> Add Code
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="relative sections-table-container">
                            <div className="rounded-md border overflow-hidden">
                                <Table className="[&_td]:align-top table-fixed w-full">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[30px]">Order</TableHead>
                                            <TableHead className="w-[40px]"></TableHead>
                                            <TableHead className="w-auto min-w-0">Content</TableHead>
                                            <TableHead className="w-[50px] text-right"></TableHead>
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
                                                            draggable={!isInRevertMode}
                                                            onDragStart={(e) => onDragStart(s.id, e)}
                                                            onDragEnd={() => { setDraggingId(null); setOverInfo({ id: null, where: 'below' }) }}
                                                            className={`p-1 rounded hover:bg-accent text-muted-foreground ${isInRevertMode ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing'} ${draggingId === s.id ? 'opacity-60 ring-2 ring-primary/40' : ''}`}
                                                            title={isInRevertMode ? "Disabled in revert mode" : "Drag to reorder"}
                                                            disabled={isInRevertMode}
                                                        >
                                                            <GripVertical className="h-4 w-4" />
                                                        </button>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="mt-1">
                                                            {getSectionTypeIcon(s.type)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="w-auto min-w-0 max-w-full">
                                                        <div className="w-full min-w-0">
                                                            <SectionEditor
                                                                section={s}
                                                                onLocalChange={isInRevertMode ? () => {} : createOnLocalChangeHandler(s.id)}
                                                                isDragging={!!draggingId}
                                                                userId={userId}
                                                                disabled={isInRevertMode}
                                                            />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right w-[50px] min-w-[50px]">
                                                        <Button variant="ghost" size="icon" onClick={() => deleteSection(s.id)} className="h-8 w-8" disabled={isInRevertMode}>
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
                            {!hideComments && !isInRevertMode && localSections?.map((s) => {
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
                        {hideComments || isInRevertMode ? (
                            <Input id="redirect" value={redirect} onChange={handleRedirectChange} placeholder="Redirect URL (optional)" disabled={isInRevertMode} />
                        ) : (
                            <CommentableInput
                                articleId={articleId}
                                blogId={currentBlog?.$id || ''}
                                targetType="redirect"
                                commentCount={redirectCommentCount.count}
                                hasNewComments={redirectCommentCount.hasNewComments}
                            >
                                <Input id="redirect" value={redirect} onChange={handleRedirectChange} placeholder="Redirect URL (optional)" disabled={isInRevertMode} />
                            </CommentableInput>
                        )}
                    </div>
                </section>


                {/* Sticky bottom actions — stop before agent rail */}
                <div className="fixed bottom-0 inset-x-0 md:left-[18rem] md:right-0 lg:left-[20rem] lg:right-0 xl:left-[24rem] xl:right-0 z-20 border-t bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
                    <div className="px-6 py-3 flex items-center justify-between max-w-6xl mx-auto">
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <RevisionPopover 
                                articleId={articleId}
                                currentRevisionId={article?.activeRevisionId}
                                formRevisionId={latestRevision?.$id}
                                currentRevisionVersion={latestRevision?.version}
                                debugMode={showDebug}
                                onRevertToRevision={handleSelectRevisionForRevert}
                                onScrollToTop={scrollToTop}
                                onDeleteRevision={async (revisionId) => {
                                    try {
                                        // Disable data loading temporarily during deletion
                                        isRevertingRef.current = true
                                        
                                        await db.revisions.delete(revisionId)
                                        
                                        // Update revisions cache directly to prevent race conditions
                                        qc.setQueryData(['revisions', articleId], (oldData: any) => {
                                            if (!oldData) return oldData
                                            return {
                                                ...oldData,
                                                documents: (oldData.documents || []).filter((rev: any) => rev.$id !== revisionId)
                                            }
                                        })
                                        
                                        // Re-enable data loading after a short delay
                                        setTimeout(() => {
                                            isRevertingRef.current = false
                                        }, 1000)
                                        
                                        toast({ title: 'Revision deleted' })
                                    } catch (error) {
                                        // Re-enable data loading on error
                                        isRevertingRef.current = false
                                        
                                        toast({ 
                                            title: 'Failed to delete revision', 
                                            description: error instanceof Error ? error.message : 'Unknown error',
                                            variant: 'destructive'
                                        })
                                    }
                                }}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="default"
                                onClick={handleSave}
                                disabled={isSaving || !hasChanges}
                                className="whitespace-nowrap"
                            >
                                {isSaving ? 'Saving...' : 'Save'}
                            </Button>
                            <Button
                                variant="default"
                                size="default"
                                className="whitespace-nowrap cursor-pointer bg-black hover:bg-gray-800 text-white font-semibold px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-200 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                                onClick={handleDeploy}
                                disabled={saving || isInRevertMode}
                            >
                                {saving ? 'Releasing...' : 'Release'}
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

            {/* Release Confirmation Dialog */}
            <AlertDialog open={showReleaseConfirm} onOpenChange={setShowReleaseConfirm}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-left">
                            Release Article
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-left">
                            Are you sure you want to release <strong>"{title || 'Untitled'}"</strong>? 
                            This will update the article status to "Publish" and make it live to your audience.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel className="order-2 sm:order-1">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmRelease}
                            className="order-1 sm:order-2 bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 cursor-pointer"
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Releasing...
                                </>
                            ) : (
                                'Yes, Release Article'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>


        </>
    )
}

function SectionEditor({ section, onLocalChange, isDragging = false, userId, disabled = false }: { section: any; onLocalChange: (data: Partial<any>) => void; isDragging?: boolean; userId: string; disabled?: boolean }) {
    if (section.type === 'title') {
        return <TitleEditor section={section} onLocalChange={onLocalChange} disabled={disabled} />
    }
    if (section.type === 'quote') {
        return <QuoteEditor section={section} onLocalChange={onLocalChange} disabled={disabled} />
    }
    if (section.type === 'text' || section.type === 'paragraph') {
        return <TextEditor section={section} onLocalChange={onLocalChange} disabled={disabled} />
    }
    if (section.type === 'image') {
        return <ImageEditor section={section} onLocalChange={onLocalChange} userId={userId} disabled={disabled} />
    }
    if (section.type === 'video') {
        return <VideoEditor section={section} onLocalChange={onLocalChange} disabled={disabled} />
    }
    if (section.type === 'map') {
        return <MapEditor section={section} onLocalChange={onLocalChange} disabled={disabled} />
    }
    if (section.type === 'code') {
        return <CodeSectionEditor section={section} onLocalChange={onLocalChange} isDragging={isDragging} disabled={disabled} />
    }
    return <span className="text-sm text-muted-foreground">Unsupported section</span>
}

const TitleEditor = memo(({ section, onLocalChange, disabled = false }: { section: any; onLocalChange: (data: Partial<any>) => void; disabled?: boolean }) => {
    const [value, setValue] = useState(section.content ?? '')
    const onLocalChangeRef = useRef(onLocalChange)
    onLocalChangeRef.current = onLocalChange

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value)
    }, [])

    // Sync external changes to local state (when section content changes externally)
    useEffect(() => {
        if (section.content !== value) {
            setValue(section.content ?? '')
        }
    }, [section.content])

    useEffect(() => {
        onLocalChangeRef.current({ content: value, type: 'title' })
    }, [value])

    return (
        <div className="space-y-1">
            <Label htmlFor={`title-${section.id}`}>Title</Label>
            <Input
                id={`title-${section.id}`}
                value={value}
                onChange={handleChange}
                placeholder="Section title"
                disabled={disabled}
            />
        </div>
    )
})

const QuoteEditor = memo(({ section, onLocalChange, disabled = false }: { section: any; onLocalChange: (data: Partial<any>) => void; disabled?: boolean }) => {
    const [quote, setQuote] = useState(section.content ?? '')
    const [speaker, setSpeaker] = useState(section.speaker ?? '')
    const quoteRef = useRef<HTMLTextAreaElement | null>(null)
    const onLocalChangeRef = useRef(onLocalChange)
    onLocalChangeRef.current = onLocalChange

    // Function to adjust textarea height
    const adjustHeight = useCallback(() => {
        if (!quoteRef.current) return
        quoteRef.current.style.height = 'auto'
        quoteRef.current.style.height = quoteRef.current.scrollHeight + 'px'
    }, [])

    // Adjust height when quote content changes
    useEffect(() => {
        const frameId = requestAnimationFrame(() => {
            adjustHeight()
            setTimeout(adjustHeight, 0)
        })
        return () => cancelAnimationFrame(frameId)
    }, [quote, adjustHeight])

    const handleQuoteChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setQuote(e.target.value)
    }, [])

    const handleSpeakerChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSpeaker(e.target.value)
    }, [])

    // Sync external changes to local state (when section content changes externally)
    useEffect(() => {
        if (section.content !== quote) {
            setQuote(section.content ?? '')
        }
        if (section.speaker !== speaker) {
            setSpeaker(section.speaker ?? '')
        }
    }, [section.content, section.speaker])

    useEffect(() => {
        onLocalChangeRef.current({ content: quote, speaker, type: 'quote' })
    }, [quote, speaker])

    return (
        <div className="space-y-2 w-full min-w-0">
            <div className="space-y-1">
                <Label htmlFor={`quote-${section.id}`}>Quote</Label>
                <Textarea 
                    ref={quoteRef}
                    id={`quote-${section.id}`} 
                    value={quote} 
                    onChange={handleQuoteChange} 
                    placeholder="Add a memorable line…" 
                    rows={2}
                    className="w-full min-w-0 min-h-[60px]"
                    style={{ 
                        width: '100%', 
                        maxWidth: '100%',
                        overflow: 'hidden',
                        resize: 'none'
                    }}
                    disabled={disabled}
                />
            </div>
            <div className="space-y-1">
                <Label htmlFor={`speaker-${section.id}`}>Speaker</Label>
                <Input 
                    id={`speaker-${section.id}`} 
                    value={speaker} 
                    onChange={handleSpeakerChange} 
                    placeholder="Who said it?"
                    className="w-full min-w-0"
                    style={{ width: '100%', maxWidth: '100%' }}
                    disabled={disabled}
                />
            </div>
        </div>
    )
})

const TextEditor = memo(({ section, onLocalChange, disabled = false }: { section: any; onLocalChange: (data: Partial<any>) => void; disabled?: boolean }) => {
    const [value, setValue] = useState(section.content ?? '')
    const ref = useRef<HTMLTextAreaElement | null>(null)
    const onLocalChangeRef = useRef(onLocalChange)
    onLocalChangeRef.current = onLocalChange

    // Function to adjust textarea height
    const adjustHeight = useCallback(() => {
        if (!ref.current) return
        // Reset height to auto to get the correct scrollHeight
        ref.current.style.height = 'auto'
        // Set height to scrollHeight to fit content
        ref.current.style.height = ref.current.scrollHeight + 'px'
    }, [])

    // Adjust height when value changes or component mounts
    useEffect(() => {
        // Use requestAnimationFrame to ensure DOM is fully updated
        const frameId = requestAnimationFrame(() => {
            adjustHeight()
            // Add a small delay to ensure DOM is fully updated after AI text insertion
            setTimeout(adjustHeight, 0)
        })
        return () => cancelAnimationFrame(frameId)
    }, [value, adjustHeight])

    // Also adjust height when the component mounts or when section content changes externally
    useEffect(() => {
        if (section.content !== value) {
            setValue(section.content ?? '')
        }
    }, [section.content])

    // Adjust height on mount
    useEffect(() => {
        adjustHeight()
    }, [adjustHeight])

    useEffect(() => {
        onLocalChangeRef.current({ content: value, type: 'text' })
    }, [value])

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value)
    }, [])

    return (
        <div className="space-y-1 w-full min-w-0">
            <Label htmlFor={`text-${section.id}`}>Text</Label>
            <Textarea
                id={`text-${section.id}`}
                ref={ref}
                value={value}
                onChange={handleChange}
                placeholder="Write text…"
                rows={1}
                className="min-h-[40px] text-sm w-full min-w-0"
                style={{ overflow: 'hidden', resize: 'none', width: '100%', maxWidth: '100%' }}
                disabled={disabled}
            />
        </div>
    )
})

function ImageEditor({ section, onLocalChange, userId, disabled = false }: { section: any; onLocalChange: (data: Partial<any>) => void; userId: string; disabled?: boolean }) {
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
                onImagesChange={disabled ? () => {} : handleImagesChange}
                userId={userId}
                disabled={disabled}
            />
            <div className="space-y-1">
                <Label htmlFor={`caption-${section.id}`}>Caption</Label>
                <Input 
                    id={`caption-${section.id}`} 
                    value={section.caption ?? ''} 
                    onChange={(e) => onLocalChange({ caption: e.target.value })} 
                    placeholder="Caption (optional)" 
                    disabled={disabled}
                />
            </div>
        </div>
    )
}

function VideoEditor({ section, onLocalChange, disabled = false }: { section: any; onLocalChange: (data: Partial<any>) => void; disabled?: boolean }) {
    const [url, setUrl] = useState(section.embedUrl ?? '')
    const [isValid, setIsValid] = useState(true)
    const [hasUserTyped, setHasUserTyped] = useState(false)
    
    const embed = toYouTubeEmbed(url)
    const isValidUrl = isValidYouTubeUrl(url)
    const showError = hasUserTyped && url.length > 0 && !isValidUrl

    // Sync external changes to local state (when section content changes externally)
    useEffect(() => {
        if (section.embedUrl !== url) {
            setUrl(section.embedUrl ?? '')
        }
    }, [section.embedUrl])

    useEffect(() => {
        onLocalChange({ embedUrl: url })
    }, [url])

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newUrl = e.target.value
        setUrl(newUrl)
        setHasUserTyped(true)
        setIsValid(isValidYouTubeUrl(newUrl))
    }

    return (
        <div className="space-y-2">
            <div className="space-y-1">
                <Label htmlFor={`video-url-${section.id}`}>Video URL</Label>
                <Input 
                    id={`video-url-${section.id}`} 
                    value={url} 
                    onChange={handleUrlChange} 
                    placeholder="Paste YouTube URL" 
                    disabled={disabled}
                    className={showError ? "border-red-500 focus:border-red-500" : ""}
                />
                {showError && (
                    <p className="text-sm text-red-500">
                        Please enter a valid YouTube URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID)
                    </p>
                )}
            </div>
            {embed && isValidUrl && (
                <div className="aspect-video w-full">
                    <iframe 
                        className="w-full h-full rounded-lg border" 
                        src={embed} 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen 
                        title="YouTube preview" 
                    />
                </div>
            )}
            <div className="space-y-1">
                <Label htmlFor={`caption-${section.id}`}>Caption</Label>
                <Input id={`caption-${section.id}`} value={section.caption ?? ''} onChange={(e) => onLocalChange({ caption: e.target.value })} placeholder="Caption (optional)" disabled={disabled} />
            </div>
        </div>
    )
}

function MapEditor({ section, onLocalChange, disabled = false }: { section: any; onLocalChange: (data: Partial<any>) => void; disabled?: boolean }) {
    // Parse the section data - it could be JSON string or comma-separated string
    const parseSectionData = (data: any) => {
        if (!data) return null
        
        // Try to parse as JSON first
        if (typeof data === 'string' && data.startsWith('{')) {
            try {
                const parsed = JSON.parse(data)
                return { lat: parsed.lat, lng: parsed.lng }
            } catch (e) {
                // If JSON parsing fails, try the old comma-separated format
                return parseLatLng(data)
            }
        }
        
        // Try the old comma-separated format
        return parseLatLng(data)
    }
    
    const initial = parseSectionData(section.data)
    const [lat, setLat] = useState<string | number>(initial?.lat ?? '')
    const [lng, setLng] = useState<string | number>(initial?.lng ?? '')
    const nlat = typeof lat === 'number' ? lat : parseFloat(lat)
    const nlng = typeof lng === 'number' ? lng : parseFloat(lng)
    const iframe = toOSMEmbed(nlat, nlng)

    // Sync external changes to local state (when section data changes externally)
    useEffect(() => {
        const newData = parseSectionData(section.data)
        if (newData) {
            if (newData.lat !== lat) {
                setLat(newData.lat)
            }
            if (newData.lng !== lng) {
                setLng(newData.lng)
            }
        }
    }, [section.data])

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
                    <Input id={`lat-${section.id}`} placeholder="e.g. 37.7749" value={lat as any} onChange={(e) => setLat(e.target.value as any)} disabled={disabled} />
                </div>
                <div className="space-y-1">
                    <Label htmlFor={`lng-${section.id}`}>Longitude</Label>
                    <Input id={`lng-${section.id}`} placeholder="e.g. -122.4194" value={lng as any} onChange={(e) => setLng(e.target.value as any)} disabled={disabled} />
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

const CodeSectionEditor = memo(({ section, onLocalChange, isDragging = false, disabled = false }: { section: any; onLocalChange: (data: Partial<any>) => void; isDragging?: boolean; disabled?: boolean }) => {
    const [code, setCode] = useState(section.content ?? '')
    const [language, setLanguage] = useState('javascript')
    const onLocalChangeRef = useRef(onLocalChange)
    onLocalChangeRef.current = onLocalChange

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

    // Sync external changes to local state (when section content changes externally)
    useEffect(() => {
        if (section.content !== code) {
            setCode(section.content ?? '')
        }
    }, [section.content])

    const handleCodeChange = useCallback((newCode: string) => {
        setCode(newCode)
        onLocalChangeRef.current({ content: newCode })
    }, [])

    const handleLanguageChange = useCallback((newLanguage: string) => {
        setLanguage(newLanguage)
        // Store language in section data for persistence
        const data = section.data ? JSON.parse(section.data) : {}
        data.language = newLanguage
        onLocalChangeRef.current({ data: JSON.stringify(data) })
    }, [section.data])

    return (
        <div className="space-y-2">
            <CodeEditor
                value={code}
                onChange={disabled ? () => {} : handleCodeChange}
                language={language}
                onLanguageChange={disabled ? () => {} : handleLanguageChange}
                isDragging={isDragging}
                id={`code-${section.id}`}
            />
        </div>
    )
})

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

function firstInputIdFor(type: string, sectionId?: string) {
    if (!sectionId) {
        // Fallback to generic IDs if no section ID provided
        switch (type) {
            case 'title': return 'title'
            case 'text': return 'text'
            case 'quote': return 'quote'
            case 'image': return 'caption'
            case 'video': return 'url'
            case 'map': return 'lat'
            case 'code': return 'code'
            default: return 'content'
        }
    }
    
    // Return section-specific IDs
    switch (type) {
        case 'title': return `title-${sectionId}`
        case 'text': return `text-${sectionId}`
        case 'quote': return `quote-${sectionId}`
        case 'image': return `caption-${sectionId}`
        case 'video': return `video-url-${sectionId}`
        case 'map': return `lat-${sectionId}`
        case 'code': return `code-${sectionId}`
        default: return `content-${sectionId}`
    }
}

function isValidYouTubeUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false
    
    // Trim whitespace
    url = url.trim()
    
    // Check if it's a valid URL format
    try {
        new URL(url)
    } catch {
        return false
    }
    
    // YouTube URL patterns
    const youtubePatterns = [
        /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
        /^https?:\/\/(www\.)?youtu\.be\/[\w-]+/,
        /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/,
        /^https?:\/\/(www\.)?youtube\.com\/v\/[\w-]+/,
        /^https?:\/\/(www\.)?youtube\.com\/shorts\/[\w-]+/
    ]
    
    return youtubePatterns.some(pattern => pattern.test(url))
}

function toYouTubeEmbed(url: string): string | null {
    if (!isValidYouTubeUrl(url)) return null
    
    const videoId = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([^&\n?#]+)/)?.[1]
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null
}

function parseLatLng(input: string | undefined | null) {
    if (!input || typeof input !== 'string') {
        return null
    }
    const match = input.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/)
    return match ? { lat: parseFloat(match[1]), lng: parseFloat(match[2]) } : null
}

function toOSMEmbed(lat: number, lng: number, zoom = 15) {
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01},${lat-0.01},${lng+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lng}`
}


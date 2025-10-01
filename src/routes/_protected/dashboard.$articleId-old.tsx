import { createFileRoute, Link } from '@tanstack/react-router'
import { useAuth } from '@/hooks/use-auth'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { db } from '@/lib/appwrite/db'
import { files } from '@/lib/appwrite/storage'
import type { Articles } from '@/lib/appwrite/appwrite.types'
import { type Models } from 'appwrite'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { Image as ImageIcon, Trash2, Save, Video, MapPin, Type as TypeIcon, Upload, ArrowLeft, LogOut, GripVertical, Brain, Quote } from 'lucide-react'
import { AgentChat } from '@/components/agent/agent-chat'

export const Route = createFileRoute('/_protected/dashboard/$articleId-old')({
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
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">Articles</Button>
          </Link>
          <Button variant="outline" size="sm" onClick={onSignOut}>
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

  const updateSection = (id: string, data: any) => {
    setLocalSections(prev => prev.map(section => 
      section.id === id ? { ...section, ...data } : section
    ))
  }

  const deleteSection = (id: string) => {
    setLocalSections(prev => prev.filter(section => section.id !== id))
  }


  // Drag & drop ordering with clear cues
  const dragIdRef = useRef<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overInfo, setOverInfo] = useState<{ id: string | null; where: 'above' | 'below' }>({ id: null, where: 'below' })

  const onDragStart = (id: string, e: React.DragEvent) => {
    dragIdRef.current = id
    setDraggingId(id)
    e.dataTransfer.effectAllowed = 'move'
    try { e.dataTransfer.setData('text/plain', id) } catch {}
  }

  const onDragOverRow = (id: string, e: React.DragEvent) => {
    e.preventDefault()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const where = e.clientY < rect.top + rect.height / 2 ? 'above' : 'below'
    setOverInfo({ id, where })
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
      const tgt = prev.findIndex((s) => s.id === targetId)
      if (src < 0 || tgt < 0) return prev
      const next = [...prev]
      const [moved] = next.splice(src, 1)
      // Compute actual insertion index based on above/below
      let insertIndex = tgt
      if (currentOver.id === targetId && currentOver.where === 'below') insertIndex = tgt + 1
      if (src < insertIndex) insertIndex -= 1
      next.splice(insertIndex, 0, moved)
      const normalized = next.map((s, i) => ({ ...s, position: i }))
      persistOrder(normalized)
      return normalized
    })
  }

  const [title, setTitle] = useState('')
  const [subtitle, setExcerpt] = useState('')
  const [saving, setSaving] = useState(false)

  useMemo(() => {
    if (article) {
      setTitle(article.title ?? '')
      setExcerpt(article.subtitle ?? '')
    }
  }, [article])

  const handleMainSave = async () => {
    try {
      setSaving(true)
      await updateArticle.mutateAsync({ 
        title, 
        slug: slugify(title), 
        subtitle,
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
    return <div className="text-sm text-muted-foreground p-6">Loading…</div>
  }

  return (
    <main className="flex-1">
      <AgentChat
        title={title}
        excerpt={subtitle}
        onSetTitle={setTitle}
        onSetExcerpt={setExcerpt}
      />
      <div className="px-6 py-6 space-y-8 pb-24 ml-72 md:ml-80 lg:ml-96">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
            </Link>
          </div>
        </div>

        <section className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Article title" />
          </div>
          <div>
            <Label htmlFor="subtitle">Excerpt</Label>
            <Input id="subtitle" value={subtitle} onChange={(e) => setExcerpt(e.target.value)} placeholder="Short summary (optional)" />
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span>Status:</span>
            {article.published ? <span className="text-green-600">Published</span> : <span className="text-amber-600">Draft</span>}
            {article.publishedAt && <span>• {new Date(article.publishedAt).toLocaleString()}</span>}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium">Sections</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => createSection('text')}><TypeIcon className="h-4 w-4 mr-1" /> Text</Button>
              <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => createSection('image')}><ImageIcon className="h-4 w-4 mr-1" /> Image</Button>
              <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => createSection('video')}><Video className="h-4 w-4 mr-1" /> Video</Button>
              <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => createSection('map')}><MapPin className="h-4 w-4 mr-1" /> Map</Button>
              <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => createSection('quote')}><Quote className="h-4 w-4 mr-1" /> Quote</Button>
            </div>
          </div>

          {(localSections?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No sections yet. Add one above.</p>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
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
                        <TableCell className="capitalize">{s.type}</TableCell>
                        <TableCell>
                          <SectionEditor
                            section={s}
                            onLocalChange={(patch) => updateSection(s.id, patch)}
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
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      </div>

      {/* Fixed bottom actions */}
      <div className="fixed bottom-0 inset-x-0 z-20 border-t bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="px-6 py-3 flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            className="whitespace-nowrap"
            onClick={() => updateArticle.mutate({ published: !article.published, publishedAt: !article.published ? new Date().toISOString() : null })}
          >
            {article.published ? 'Unpublish' : 'Publish'}
          </Button>
          <Button onClick={handleMainSave} disabled={saving}>
            <Save className="h-4 w-4 mr-1" /> {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </main>
  )
}

function SectionEditor({ section, onLocalChange }: { section: any; onLocalChange: (data: Partial<any>) => void }) {
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
  if (section.type === 'quote') {
    return <QuoteEditor section={section} onLocalChange={onLocalChange} />
  }
  return <span className="text-sm text-muted-foreground">Unsupported section</span>
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

function QuoteEditor({ section, onLocalChange }: { section: any; onLocalChange: (data: Partial<any>) => void }) {
  const [content, setContent] = useState(section.content ?? '')
  const [speaker, setSpeaker] = useState((section as any).speaker ?? '')

  useEffect(() => {
    onLocalChange({ content, speaker, type: 'quote' } as any)
  }, [content, speaker])

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label htmlFor={`quote-${section.id}`}>Quote</Label>
        <Textarea id={`quote-${section.id}`} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Add a quote…" rows={2} className="text-sm" />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`speaker-${section.id}`}>Speaker</Label>
        <Input id={`speaker-${section.id}`} value={speaker} onChange={(e) => setSpeaker(e.target.value)} placeholder="Name (optional)" />
      </div>
    </div>
  )
}

function ImageEditor({ section, onLocalChange }: { section: any; onLocalChange: (data: Partial<any>) => void }) {
  const [uploading, setUploading] = useState(false)
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

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label htmlFor={`file-${section.id}`}>Image</Label>
        <div className="flex items-start gap-3">
          {previewUrl ? (
            <img src={previewUrl} alt="" className="max-h-32 rounded border" />
          ) : (
            <div className="text-sm text-muted-foreground">No image</div>
          )}
          <div className="flex items-center gap-2">
            <label className="inline-flex" htmlFor={`file-${section.id}`}>
              <input
                id={`file-${section.id}`}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] || undefined)}
              />
              <Button size="sm" type="button" asChild={false} disabled={uploading}>
                <span className="inline-flex items-center"><Upload className="h-4 w-4 mr-1" /> {uploading ? 'Uploading…' : 'Upload'}</span>
              </Button>
            </label>
            {section.mediaId && (
              <Button size="sm" variant="secondary" onClick={() => onLocalChange({ mediaId: null })}>Remove</Button>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor={`caption-${section.id}`}>Caption</Label>
        <Input id={`caption-${section.id}`} value={section.caption ?? ''} onChange={(e) => onLocalChange({ caption: e.target.value })} placeholder="Caption (optional)" />
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
        <div className="aspect-video w-full max-w-md">
          <iframe className="w-full h-full rounded border" src={embed} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="YouTube preview" />
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
  } catch {}
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

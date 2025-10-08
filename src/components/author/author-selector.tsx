import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '@/lib/appwrite/db'
import type { Authors } from '@/lib/appwrite/appwrite.types'
import { type Models, Query } from 'appwrite'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Check, ChevronsUpDown, Plus, X, Settings, Loader2, GripVertical, Trash2, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { useTeamBlog } from '@/hooks/use-team-blog'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface AuthorSelectorProps {
  selectedAuthorIds: string[]
  onAuthorsChange: (authorIds: string[]) => void
  userId: string
  disabled?: boolean
}

interface SortableAuthorItemProps {
  author: Authors
  onRemove: (authorId: string) => void
  disabled?: boolean
}

function SortableAuthorItem({ author, onRemove, disabled = false }: SortableAuthorItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: author.$id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: 'max-content',
    minWidth: 'fit-content'
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 bg-muted text-muted-foreground rounded-md text-sm mr-2",
        isDragging && "opacity-50"
      )}
    >
      <div
        className={`flex items-center gap-1 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing'}`}
        {...(disabled ? {} : attributes)}
        {...(disabled ? {} : listeners)}
      >
        <GripVertical className="h-3 w-3" />
        <span>{author.firstname} {author.lastname}</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-4 w-4 p-0 hover:bg-muted-foreground/20"
        onClick={(e) => {
          e.stopPropagation()
          if (!disabled) onRemove(author.$id)
        }}
        disabled={disabled}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}

export function AuthorSelector({ selectedAuthorIds, onAuthorsChange, userId, disabled = false }: AuthorSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [showNewAuthorModal, setShowNewAuthorModal] = useState(false)
  const [editingAuthor, setEditingAuthor] = useState<Authors | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(true)
  const qc = useQueryClient()
  const { currentBlog } = useTeamBlog(userId)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Debounced search value for server-side search
  const [debouncedSearchValue, setDebouncedSearchValue] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchValue(searchValue)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchValue])

  // Fetch authors for the current blog
  const { data: allAuthorsData, isPending, error } = useQuery({
    queryKey: ['authors', currentBlog?.$id],
    queryFn: async () => {
      console.log('Fetching authors for blog:', currentBlog?.$id)
      if (!currentBlog?.$id) return { documents: [], total: 0 }
      return db.authors.list([
        Query.equal('blogId', currentBlog.$id)
      ])
    },
    enabled: !!currentBlog?.$id,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  })

  const allAuthors = allAuthorsData?.documents || []
  
  // Debug logging (commented out to reduce console noise)
  // console.log('Authors query result:', { isPending, error, allAuthorsData, allAuthors })

  // Memoize selected authors to prevent unnecessary re-renders
  // This should only change when selectedAuthorIds changes, not during search
  const selectedAuthors = useMemo(() => {
    return selectedAuthorIds
      .map(id => allAuthors.find(author => author.$id === id))
      .filter((author): author is Authors => author !== undefined)
  }, [allAuthors, selectedAuthorIds])

  // Memoize filtered authors for search (only changes when search term changes)
  const filteredAuthors = useMemo(() => {
    if (!debouncedSearchValue.trim()) return allAuthors
    
    return allAuthors.filter(author => {
      const fullName = `${author.firstname || ''} ${author.lastname || ''}`.toLowerCase()
      const searchTerm = debouncedSearchValue.toLowerCase()
      return fullName.includes(searchTerm) || 
             (author.title && author.title.toLowerCase().includes(searchTerm))
    })
  }, [allAuthors, debouncedSearchValue])

  // Memoize loading skeleton to prevent unnecessary re-renders
  const AuthorTagsSkeleton = useMemo(() => {
    return (
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
    )
  }, [])


  const handleAuthorSelect = (authorId: string) => {
    if (disabled) return
    if (selectedAuthorIds.includes(authorId)) {
      onAuthorsChange(selectedAuthorIds.filter(id => id !== authorId))
    } else {
      onAuthorsChange([...selectedAuthorIds, authorId])
    }
  }

  const handleAuthorRemove = (authorId: string) => {
    if (disabled) return
    onAuthorsChange(selectedAuthorIds.filter(id => id !== authorId))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    if (disabled) return
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = selectedAuthorIds.indexOf(active.id as string)
      const newIndex = selectedAuthorIds.indexOf(over.id as string)

      onAuthorsChange(arrayMove(selectedAuthorIds, oldIndex, newIndex))
    }
  }

  // Memoize the author list items to prevent unnecessary re-renders
  const authorListItems = useMemo(() => {
    return filteredAuthors.map(author => (
      <CommandItem
        key={author.$id}
        value={author.$id}
        onSelect={() => handleAuthorSelect(author.$id)}
        className="flex items-center justify-between group"
      >
        <div className="flex items-center">
          <Check
            className={cn(
              "mr-2 h-4 w-4",
              selectedAuthorIds.includes(author.$id) ? "opacity-100" : "opacity-0"
            )}
          />
          <span>{author.firstname} {author.lastname}</span>
          {author.title && (
            <span className="ml-2 text-sm text-muted-foreground">
              - {author.title}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 cursor-pointer hover:bg-accent"
          onClick={(e) => {
            e.stopPropagation()
            setEditingAuthor(author)
            setOpen(false)
          }}
        >
          <Settings className="h-3 w-3" />
        </Button>
      </CommandItem>
    ))
  }, [filteredAuthors, selectedAuthorIds, handleAuthorSelect])

  // Memoize the selected authors display to prevent re-renders during search
  const selectedAuthorsDisplay = useMemo(() => {
    if (isPending) {
      return AuthorTagsSkeleton
    }
    
    if (selectedAuthors.length > 0) {
      return (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={selectedAuthorIds} strategy={horizontalListSortingStrategy}>
            <div className="flex flex-wrap min-h-[2rem]">
              {selectedAuthors.map(author => (
                <SortableAuthorItem
                  key={author.$id}
                  author={author}
                  onRemove={handleAuthorRemove}
                  disabled={disabled}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )
    }
    
    return (
      <div className="flex flex-wrap min-h-[2rem]">
        <div className="inline-flex items-center px-2 py-1 bg-muted text-muted-foreground rounded-md text-sm mr-2 mb-2 border border-dashed border-muted-foreground/20">
          <span>None selected</span>
        </div>
      </div>
    )
  }, [isPending, selectedAuthors, AuthorTagsSkeleton, selectedAuthorIds, sensors, handleAuthorRemove, handleDragEnd])

  return (
    <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center cursor-pointer">
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 -ml-6 mr-2 hover:bg-transparent"
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform", !isCollapsed && "rotate-180")} />
          </Button>
          <Label className="inline-label cursor-pointer">Authors</Label>
          {selectedAuthors.length > 0 && (
            <span className="text-sm text-muted-foreground ml-2">
              ({selectedAuthors.length} selected)
            </span>
          )}
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="space-y-2">
        {/* Selected authors display */}
        <div className="mt-3">
          {selectedAuthorsDisplay}
        </div>

        {/* Author selection popover */}
        <div>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
                disabled={isPending || disabled}
              >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : selectedAuthors.length > 0 ? (
                `${selectedAuthors.length} author${selectedAuthors.length > 1 ? 's' : ''} selected`
              ) : (
                "Select authors..."
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
            <Command shouldFilter={false}>
              <div className="relative">
                <CommandInput 
                  placeholder="Search authors..." 
                  value={searchValue}
                  onValueChange={(value) => {
                    console.log('CommandInput onValueChange:', value)
                    setSearchValue(value)
                  }}
                  className="w-full pr-8"
                />
                {isPending && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
              <CommandList>
                {isPending ? (
                  <div className="p-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-2 p-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    ))}
                  </div>
                ) : filteredAuthors.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-2">
                      {debouncedSearchValue.trim() ? 'No authors found' : 'No authors available'}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setOpen(false)
                        setShowNewAuthorModal(true)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add new author
                    </Button>
                  </div>
                ) : (
                  <CommandGroup>
                    {authorListItems}
                    <CommandItem
                      onSelect={() => {
                        setOpen(false)
                        setShowNewAuthorModal(true)
                      }}
                      className="text-primary"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add new author
                    </CommandItem>
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
          </Popover>
        </div>
      </CollapsibleContent>

      {/* New author modal */}
      <NewAuthorModal 
        open={showNewAuthorModal} 
        onOpenChange={setShowNewAuthorModal}
        onAuthorCreated={(authorId) => {
          onAuthorsChange([...selectedAuthorIds, authorId])
          setShowNewAuthorModal(false)
        }}
        userId={userId}
      />

      {/* Edit author modal */}
      {editingAuthor && (
        <EditAuthorModal 
          author={editingAuthor}
          open={!!editingAuthor} 
          onOpenChange={(open) => !open && setEditingAuthor(null)}
          onAuthorUpdated={() => {
            setEditingAuthor(null)
          }}
        />
      )}
    </Collapsible>
  )
}

interface NewAuthorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAuthorCreated: (authorId: string) => void
  userId: string
}

function NewAuthorModal({ open, onOpenChange, onAuthorCreated, userId }: NewAuthorModalProps) {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    title: '',
    biography: '',
    email: '',
    picture: '',
    facebook: '',
    twitter: '',
    googleplus: '',
    instagram: '',
    pinterest: '',
  })

  const qc = useQueryClient()
  const { currentBlog, currentTeam } = useTeamBlog(userId)

  const createAuthor = useMutation({
    mutationFn: async (data: Omit<Authors, keyof Models.Document>) => {
      console.log('Creating author with data:', data)
      // Ensure no ID is accidentally passed
      const cleanData = { ...data }
      delete (cleanData as any).$id
      delete (cleanData as any).id
      console.log('Clean data for creation:', cleanData)
      return db.authors.create(cleanData, currentTeam?.$id)
    },
    onSuccess: (newAuthor) => {
      qc.invalidateQueries({ queryKey: ['authors', currentBlog?.$id] })
      toast({ title: 'Author created successfully' })
      onAuthorCreated(newAuthor.$id)
      setFormData({
        firstname: '',
        lastname: '',
        title: '',
        biography: '',
        email: '',
        picture: '',
        facebook: '',
        twitter: '',
        googleplus: '',
        instagram: '',
        pinterest: '',
      })
    },
    onError: (error: any) => {
      console.error('Author creation error:', error)
      if (error.code === 409) {
        toast({ 
          title: 'Email already exists', 
          description: 'An author with this email address already exists. Please use a different email or leave it empty.',
          variant: 'destructive' 
        })
      } else {
        toast({ 
          title: 'Failed to create author', 
          description: error.message || 'An unexpected error occurred',
          variant: 'destructive' 
        })
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.firstname || !formData.lastname) {
      toast({ title: 'First name and last name are required', variant: 'destructive' })
      return
    }
    
    // Clean up empty strings to avoid unique constraint conflicts
    const cleanedData: Omit<Authors, keyof Models.Document> = {
      firstname: formData.firstname.trim() || null,
      lastname: formData.lastname.trim() || null,
      title: formData.title.trim() || null,
      biography: formData.biography.trim() || null,
      email: formData.email.trim() || null,
      picture: formData.picture.trim() || null,
      facebook: formData.facebook.trim() || null,
      twitter: formData.twitter.trim() || null,
      googleplus: formData.googleplus.trim() || null,
      instagram: formData.instagram.trim() || null,
      pinterest: formData.pinterest.trim() || null,
      blogId: currentBlog?.$id || null,
    }
    
    console.log('Form data before submission:', cleanedData)
    createAuthor.mutate(cleanedData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Author</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstname">First Name *</Label>
              <Input
                id="firstname"
                value={formData.firstname}
                onChange={(e) => setFormData(prev => ({ ...prev, firstname: e.target.value }))}
                placeholder="John"
                required
              />
            </div>
            <div>
              <Label htmlFor="lastname">Last Name *</Label>
              <Input
                id="lastname"
                value={formData.lastname}
                onChange={(e) => setFormData(prev => ({ ...prev, lastname: e.target.value }))}
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Senior Writer, Editor, etc."
            />
          </div>

          <div>
            <Label htmlFor="biography">Biography</Label>
            <Textarea
              id="biography"
              value={formData.biography}
              onChange={(e) => setFormData(prev => ({ ...prev, biography: e.target.value }))}
              placeholder="Brief biography..."
              rows={3}
            />
          </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="author@example.com"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email must be unique. Leave empty if not needed.
              </p>
            </div>

          <div>
            <Label htmlFor="picture">Profile Picture URL</Label>
            <Input
              id="picture"
              value={formData.picture}
              onChange={(e) => setFormData(prev => ({ ...prev, picture: e.target.value }))}
              placeholder="https://example.com/photo.jpg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                value={formData.facebook}
                onChange={(e) => setFormData(prev => ({ ...prev, facebook: e.target.value }))}
                placeholder="https://facebook.com/username"
              />
            </div>
            <div>
              <Label htmlFor="twitter">Twitter</Label>
              <Input
                id="twitter"
                value={formData.twitter}
                onChange={(e) => setFormData(prev => ({ ...prev, twitter: e.target.value }))}
                placeholder="https://twitter.com/username"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={formData.instagram}
                onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                placeholder="https://instagram.com/username"
              />
            </div>
            <div>
              <Label htmlFor="pinterest">Pinterest</Label>
              <Input
                id="pinterest"
                value={formData.pinterest}
                onChange={(e) => setFormData(prev => ({ ...prev, pinterest: e.target.value }))}
                placeholder="https://pinterest.com/username"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createAuthor.isPending}>
              {createAuthor.isPending ? 'Creating...' : 'Create Author'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface EditAuthorModalProps {
  author: Authors
  open: boolean
  onOpenChange: (open: boolean) => void
  onAuthorUpdated: () => void
}

function EditAuthorModal({ author, open, onOpenChange, onAuthorUpdated }: EditAuthorModalProps) {
  const [formData, setFormData] = useState({
    firstname: author.firstname || '',
    lastname: author.lastname || '',
    title: author.title || '',
    biography: author.biography || '',
    email: author.email || '',
    picture: author.picture || '',
    facebook: author.facebook || '',
    twitter: author.twitter || '',
    googleplus: author.googleplus || '',
    instagram: author.instagram || '',
    pinterest: author.pinterest || '',
  })

  const qc = useQueryClient()

  const updateAuthor = useMutation({
    mutationFn: async (data: Partial<Omit<Authors, keyof Models.Document>>) => {
      return db.authors.update(author.$id, data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['authors'] })
      toast({ title: 'Author updated successfully' })
      onAuthorUpdated()
    },
    onError: (error: any) => {
      console.error('Author update error:', error)
      if (error.code === 409) {
        toast({ 
          title: 'Email already exists', 
          description: 'An author with this email address already exists. Please use a different email or leave it empty.',
          variant: 'destructive' 
        })
      } else {
        toast({ 
          title: 'Failed to update author', 
          description: error.message || 'An unexpected error occurred',
          variant: 'destructive' 
        })
      }
    },
  })

  const deleteAuthor = useMutation({
    mutationFn: async () => {
      return db.authors.delete(author.$id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['authors'] })
      toast({ title: 'Author deleted successfully' })
      onAuthorUpdated()
    },
    onError: (error: any) => {
      console.error('Author deletion error:', error)
      toast({ 
        title: 'Failed to delete author', 
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive' 
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.firstname || !formData.lastname) {
      toast({ title: 'First name and last name are required', variant: 'destructive' })
      return
    }
    
    // Clean up empty strings to avoid unique constraint conflicts
    const cleanedData: Partial<Omit<Authors, keyof Models.Document>> = {
      firstname: formData.firstname.trim() || null,
      lastname: formData.lastname.trim() || null,
      title: formData.title.trim() || null,
      biography: formData.biography.trim() || null,
      email: formData.email.trim() || null,
      picture: formData.picture.trim() || null,
      facebook: formData.facebook.trim() || null,
      twitter: formData.twitter.trim() || null,
      googleplus: formData.googleplus.trim() || null,
      instagram: formData.instagram.trim() || null,
      pinterest: formData.pinterest.trim() || null,
    }
    
    updateAuthor.mutate(cleanedData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Author</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-firstname">First Name *</Label>
              <Input
                id="edit-firstname"
                value={formData.firstname}
                onChange={(e) => setFormData(prev => ({ ...prev, firstname: e.target.value }))}
                placeholder="John"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-lastname">Last Name *</Label>
              <Input
                id="edit-lastname"
                value={formData.lastname}
                onChange={(e) => setFormData(prev => ({ ...prev, lastname: e.target.value }))}
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Senior Writer, Editor, etc."
            />
          </div>

          <div>
            <Label htmlFor="edit-biography">Biography</Label>
            <Textarea
              id="edit-biography"
              value={formData.biography}
              onChange={(e) => setFormData(prev => ({ ...prev, biography: e.target.value }))}
              placeholder="Brief biography..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="author@example.com"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Email must be unique. Leave empty if not needed.
            </p>
          </div>

          <div>
            <Label htmlFor="edit-picture">Profile Picture URL</Label>
            <Input
              id="edit-picture"
              value={formData.picture}
              onChange={(e) => setFormData(prev => ({ ...prev, picture: e.target.value }))}
              placeholder="https://example.com/photo.jpg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-facebook">Facebook</Label>
              <Input
                id="edit-facebook"
                value={formData.facebook}
                onChange={(e) => setFormData(prev => ({ ...prev, facebook: e.target.value }))}
                placeholder="https://facebook.com/username"
              />
            </div>
            <div>
              <Label htmlFor="edit-twitter">Twitter</Label>
              <Input
                id="edit-twitter"
                value={formData.twitter}
                onChange={(e) => setFormData(prev => ({ ...prev, twitter: e.target.value }))}
                placeholder="https://twitter.com/username"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-instagram">Instagram</Label>
              <Input
                id="edit-instagram"
                value={formData.instagram}
                onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                placeholder="https://instagram.com/username"
              />
            </div>
            <div>
              <Label htmlFor="edit-pinterest">Pinterest</Label>
              <Input
                id="edit-pinterest"
                value={formData.pinterest}
                onChange={(e) => setFormData(prev => ({ ...prev, pinterest: e.target.value }))}
                placeholder="https://pinterest.com/username"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" disabled={deleteAuthor.isPending} className="bg-red-600 text-white hover:bg-red-700">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleteAuthor.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the author "{author.firstname} {author.lastname}" and remove all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteAuthor.mutate()}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateAuthor.isPending}>
                {updateAuthor.isPending ? 'Updating...' : 'Update Author'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

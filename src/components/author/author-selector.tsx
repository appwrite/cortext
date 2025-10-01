import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '@/lib/appwrite/db'
import type { Authors } from '@/lib/appwrite/appwrite.types'
import { type Models } from 'appwrite'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { Check, ChevronsUpDown, Plus, X, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

interface AuthorSelectorProps {
  selectedAuthorIds: string[]
  onAuthorsChange: (authorIds: string[]) => void
}

export function AuthorSelector({ selectedAuthorIds, onAuthorsChange }: AuthorSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [showNewAuthorModal, setShowNewAuthorModal] = useState(false)
  const [editingAuthor, setEditingAuthor] = useState<Authors | null>(null)
  const qc = useQueryClient()

  // Fetch all authors
  const { data: authorsData, isPending } = useQuery({
    queryKey: ['authors'],
    queryFn: () => db.authors.list(),
  })

  const authors = authorsData?.documents || []

  // Get selected authors for display
  const selectedAuthors = authors.filter(author => selectedAuthorIds.includes(author.$id))

  // Loading skeleton for author tags
  const AuthorTagsSkeleton = () => (
    <div className="flex flex-wrap gap-2">
      <Skeleton className="h-6 w-20 rounded-full" />
      <Skeleton className="h-6 w-24 rounded-full" />
    </div>
  )

  // Filter authors based on search
  const filteredAuthors = authors.filter(author => {
    const fullName = `${author.firstname || ''} ${author.lastname || ''}`.toLowerCase()
    return fullName.includes(searchValue.toLowerCase())
  })

  const handleAuthorSelect = (authorId: string) => {
    if (selectedAuthorIds.includes(authorId)) {
      onAuthorsChange(selectedAuthorIds.filter(id => id !== authorId))
    } else {
      onAuthorsChange([...selectedAuthorIds, authorId])
    }
  }

  const handleAuthorRemove = (authorId: string) => {
    onAuthorsChange(selectedAuthorIds.filter(id => id !== authorId))
  }

  return (
    <div className="space-y-2">
      <Label>Authors</Label>
      
      {/* Selected authors display */}
      {isPending ? (
        <AuthorTagsSkeleton />
      ) : selectedAuthors.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedAuthors.map(author => (
            <Badge key={author.$id} variant="secondary" className="flex items-center gap-1">
              {author.firstname} {author.lastname}
              <button
                onClick={() => handleAuthorRemove(author.$id)}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}

      {/* Author selection popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={isPending}
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
          <Command>
            <CommandInput 
              placeholder="Search authors..." 
              value={searchValue}
              onValueChange={setSearchValue}
              className="w-full"
            />
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
              ) : (
                <>
                  <CommandEmpty>
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground mb-2">No authors found</p>
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
                  </CommandEmpty>
                  <CommandGroup>
                    {filteredAuthors.map(author => (
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
                    ))}
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
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* New author modal */}
      <NewAuthorModal 
        open={showNewAuthorModal} 
        onOpenChange={setShowNewAuthorModal}
        onAuthorCreated={(authorId) => {
          onAuthorsChange([...selectedAuthorIds, authorId])
          setShowNewAuthorModal(false)
        }}
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
    </div>
  )
}

interface NewAuthorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAuthorCreated: (authorId: string) => void
}

function NewAuthorModal({ open, onOpenChange, onAuthorCreated }: NewAuthorModalProps) {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    title: '',
    biography: '',
    email: '',
    picture: '',
    facebook: '',
    twitter: '',
    instagram: '',
    pinterest: '',
  })

  const qc = useQueryClient()

  const createAuthor = useMutation({
    mutationFn: async (data: Omit<Authors, keyof Models.Document>) => {
      return db.authors.create(data)
    },
    onSuccess: (newAuthor) => {
      qc.invalidateQueries({ queryKey: ['authors'] })
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
        instagram: '',
        pinterest: '',
      })
    },
    onError: () => {
      toast({ title: 'Failed to create author', variant: 'destructive' })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.firstname || !formData.lastname) {
      toast({ title: 'First name and last name are required', variant: 'destructive' })
      return
    }
    createAuthor.mutate(formData)
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
    onError: () => {
      toast({ title: 'Failed to update author', variant: 'destructive' })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.firstname || !formData.lastname) {
      toast({ title: 'First name and last name are required', variant: 'destructive' })
      return
    }
    updateAuthor.mutate(formData)
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

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateAuthor.isPending}>
              {updateAuthor.isPending ? 'Updating...' : 'Update Author'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

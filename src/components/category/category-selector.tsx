import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '@/lib/appwrite/db'
import type { Categories } from '@/lib/appwrite/appwrite.types'
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

interface CategorySelectorProps {
  selectedCategoryIds: string[]
  onCategoriesChange: (categoryIds: string[]) => void
  userId: string
  disabled?: boolean
}

interface SortableCategoryItemProps {
  category: Categories
  onRemove: (categoryId: string) => void
  disabled?: boolean
}

function SortableCategoryItem({ category, onRemove, disabled = false }: SortableCategoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.$id })

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
        <span>{category.name}</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-4 w-4 p-0 hover:bg-muted-foreground/20"
        onClick={(e) => {
          e.stopPropagation()
          if (!disabled) onRemove(category.$id)
        }}
        disabled={disabled}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}

export function CategorySelector({ selectedCategoryIds, onCategoriesChange, userId, disabled = false }: CategorySelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Categories | null>(null)
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

  // Fetch categories for the current blog
  const { data: allCategoriesData, isPending, error } = useQuery({
    queryKey: ['categories', currentBlog?.$id],
    queryFn: async () => {
      console.log('Fetching categories for blog:', currentBlog?.$id)
      if (!currentBlog?.$id) return { documents: [], total: 0 }
      return db.categories.list([
        Query.equal('blogId', currentBlog.$id)
      ])
    },
    enabled: !!currentBlog?.$id,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  })

  const allCategories = allCategoriesData?.documents || []
  
  // Debug logging (commented out to reduce console noise)
  // console.log('Categories query result:', { isPending, error, allCategoriesData, allCategories })

  // Memoize selected categories to prevent unnecessary re-renders
  // This should only change when selectedCategoryIds changes, not during search
  const selectedCategories = useMemo(() => {
    return selectedCategoryIds
      .map(id => allCategories.find(category => category.$id === id))
      .filter((category): category is Categories => category !== undefined)
  }, [allCategories, selectedCategoryIds])

  // Memoize filtered categories for search (only changes when search term changes)
  const filteredCategories = useMemo(() => {
    if (!debouncedSearchValue.trim()) return allCategories
    
    return allCategories.filter(category => {
      const name = category.name?.toLowerCase() || ''
      const description = category.description?.toLowerCase() || ''
      const searchTerm = debouncedSearchValue.toLowerCase()
      return name.includes(searchTerm) || description.includes(searchTerm)
    })
  }, [allCategories, debouncedSearchValue])

  // Memoize loading skeleton to prevent unnecessary re-renders
  const CategoryTagsSkeleton = useMemo(() => {
    return (
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
    )
  }, [])

  const handleCategorySelect = (categoryId: string) => {
    if (disabled) return
    if (selectedCategoryIds.includes(categoryId)) {
      onCategoriesChange(selectedCategoryIds.filter(id => id !== categoryId))
    } else {
      onCategoriesChange([...selectedCategoryIds, categoryId])
    }
  }

  const handleCategoryRemove = (categoryId: string) => {
    if (disabled) return
    onCategoriesChange(selectedCategoryIds.filter(id => id !== categoryId))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    if (disabled) return
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = selectedCategoryIds.indexOf(active.id as string)
      const newIndex = selectedCategoryIds.indexOf(over.id as string)

      onCategoriesChange(arrayMove(selectedCategoryIds, oldIndex, newIndex))
    }
  }

  // Memoize the category list items to prevent unnecessary re-renders
  const categoryListItems = useMemo(() => {
    return filteredCategories.map((category) => {
      const isSelected = selectedCategoryIds.includes(category.$id)
      return (
        <CommandItem
          key={category.$id}
          value={category.$id}
          onSelect={() => handleCategorySelect(category.$id)}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Check
              className={cn(
                "h-4 w-4",
                isSelected ? "opacity-100" : "opacity-0"
              )}
            />
            <div>
              <div className="font-medium">{category.name}</div>
              {category.description && (
                <div className="text-sm text-muted-foreground">{category.description}</div>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation()
              setEditingCategory(category)
            }}
          >
            <Settings className="h-3 w-3" />
          </Button>
        </CommandItem>
      )
    })
  }, [filteredCategories, selectedCategoryIds])

  if (isPending) {
    return (
      <div className="space-y-2">
        <Label>Categories</Label>
        {CategoryTagsSkeleton}
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-2">
        <Label>Categories</Label>
        <div className="text-sm text-destructive">Failed to load categories</div>
      </div>
    )
  }

  return (
    <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
      <div className="flex items-center">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 -ml-6 mr-2 hover:bg-transparent"
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform", !isCollapsed && "rotate-180")} />
          </Button>
        </CollapsibleTrigger>
        <Label className="inline-label">Categories</Label>
        {selectedCategories.length > 0 && (
          <span className="text-sm text-muted-foreground ml-2">
            ({selectedCategories.length} selected)
          </span>
        )}
      </div>
      
      <CollapsibleContent className="space-y-2">
        {/* Selected categories with drag and drop */}
        <div className="mt-3">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={selectedCategoryIds}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex flex-wrap min-h-[2rem]">
              {selectedCategories.length > 0 ? (
                selectedCategories.map((category) => (
                  <SortableCategoryItem
                    key={category.$id}
                    category={category}
                    onRemove={handleCategoryRemove}
                    disabled={disabled}
                  />
                ))
              ) : (
                <div className="inline-flex items-center px-2 py-1 bg-muted text-muted-foreground rounded-md text-sm mr-2 mb-2 border border-dashed border-muted-foreground/20">
                  <span>None selected</span>
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
        </div>

        {/* Category selector popover */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
              disabled={disabled}
            >
              {selectedCategoryIds.length > 0
                ? `${selectedCategoryIds.length} categor${selectedCategoryIds.length === 1 ? 'y' : 'ies'} selected`
                : "Select categories..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
            <Command>
              <CommandInput
                placeholder="Search categories..."
                value={searchValue}
                onValueChange={setSearchValue}
                className="w-full"
              />
              <CommandList>
                <CommandGroup>
                  {categoryListItems}
                  {filteredCategories.length === 0 && (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      No categories found.
                    </div>
                  )}
                </CommandGroup>
                <CommandGroup>
                  <CommandItem onSelect={() => setShowNewCategoryModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create new category
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </CollapsibleContent>

      {/* New category modal */}
      <NewCategoryModal 
        open={showNewCategoryModal} 
        onOpenChange={setShowNewCategoryModal}
        onCategoryCreated={(categoryId) => {
          onCategoriesChange([...selectedCategoryIds, categoryId])
          setShowNewCategoryModal(false)
        }}
        userId={userId}
      />

      {/* Edit category modal */}
      {editingCategory && (
        <EditCategoryModal 
          category={editingCategory}
          open={!!editingCategory} 
          onOpenChange={(open) => !open && setEditingCategory(null)}
          onCategoryUpdated={() => {
            setEditingCategory(null)
          }}
          currentBlog={currentBlog}
        />
      )}
    </Collapsible>
  )
}

interface NewCategoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCategoryCreated: (categoryId: string) => void
  userId: string
}

function NewCategoryModal({ open, onOpenChange, onCategoryCreated, userId }: NewCategoryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  })

  const qc = useQueryClient()
  const { currentBlog, currentTeam } = useTeamBlog(userId)

  const createCategory = useMutation({
    mutationFn: async (data: Omit<Categories, keyof Models.Document>) => {
      console.log('Creating category with data:', data)
      // Ensure no ID is accidentally passed
      const cleanData = { ...data }
      delete (cleanData as any).$id
      delete (cleanData as any).id
      console.log('Clean data for creation:', cleanData)
      return db.categories.create(cleanData, currentTeam?.$id)
    },
    onSuccess: (newCategory) => {
      qc.invalidateQueries({ queryKey: ['categories', currentBlog?.$id] })
      toast({ title: 'Category created successfully' })
      onCategoryCreated(newCategory.$id)
      setFormData({
        name: '',
        slug: '',
        description: '',
      })
    },
    onError: (error: any) => {
      console.error('Category creation error:', error)
      toast({ 
        title: 'Failed to create category', 
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive' 
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast({
        title: 'Name is required',
        variant: 'destructive'
      })
      return
    }

    // Generate slug from name if not provided
    const slug = formData.slug.trim() || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    
    createCategory.mutate({
      name: formData.name.trim(),
      slug,
      description: formData.description.trim() || null,
      blogId: currentBlog?.$id || null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Category</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Category name"
              required
            />
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              placeholder="category-slug (auto-generated if empty)"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Category description (optional)"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCategory.isPending}>
              {createCategory.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Category
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface EditCategoryModalProps {
  category: Categories
  open: boolean
  onOpenChange: (open: boolean) => void
  onCategoryUpdated: () => void
  currentBlog: any
}

function EditCategoryModal({ category, open, onOpenChange, onCategoryUpdated, currentBlog }: EditCategoryModalProps) {
  const [formData, setFormData] = useState({
    name: category.name || '',
    slug: category.slug || '',
    description: category.description || '',
  })

  const qc = useQueryClient()

  const updateCategory = useMutation({
    mutationFn: async (data: Partial<Omit<Categories, keyof Models.Document>>) => {
      console.log('Updating category with data:', data)
      return db.categories.update(category.$id, data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories', currentBlog?.$id] })
      toast({ title: 'Category updated successfully' })
      onCategoryUpdated()
    },
    onError: (error: any) => {
      console.error('Category update error:', error)
      toast({ 
        title: 'Failed to update category', 
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive' 
      })
    },
  })

  const deleteCategory = useMutation({
    mutationFn: async () => {
      return db.categories.delete(category.$id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories', currentBlog?.$id] })
      toast({ title: 'Category deleted successfully' })
      onCategoryUpdated()
    },
    onError: (error: any) => {
      console.error('Category deletion error:', error)
      toast({ 
        title: 'Failed to delete category', 
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive' 
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast({
        title: 'Name is required',
        variant: 'destructive'
      })
      return
    }

    // Generate slug from name if not provided
    const slug = formData.slug.trim() || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    
    updateCategory.mutate({
      name: formData.name.trim(),
      slug,
      description: formData.description.trim() || null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Name *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Category name"
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-slug">Slug</Label>
            <Input
              id="edit-slug"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              placeholder="category-slug (auto-generated if empty)"
            />
          </div>
          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Category description (optional)"
              rows={3}
            />
          </div>
          <div className="flex justify-between">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" disabled={deleteCategory.isPending} className="bg-red-600 text-white hover:bg-red-700">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleteCategory.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the category "{category.name}" and remove all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteCategory.mutate()}
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
              <Button type="submit" disabled={updateCategory.isPending}>
                {updateCategory.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Category
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '@/lib/appwrite/db'
import type { Categories } from '@/lib/appwrite/appwrite.types'
import { type Models } from 'appwrite'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { Check, ChevronsUpDown, Plus, X, Settings, Loader2, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
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
}

interface SortableCategoryItemProps {
  category: Categories
  onRemove: (categoryId: string) => void
}

function SortableCategoryItem({ category, onRemove }: SortableCategoryItemProps) {
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
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm mr-2",
        isDragging && "opacity-50"
      )}
    >
      <div
        className="cursor-grab active:cursor-grabbing flex items-center gap-1"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3 w-3" />
        <span>{category.name}</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-4 w-4 p-0 hover:bg-gray-200"
        onClick={(e) => {
          e.stopPropagation()
          onRemove(category.$id)
        }}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}

export function CategorySelector({ selectedCategoryIds, onCategoriesChange }: CategorySelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Categories | null>(null)
  const qc = useQueryClient()

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

  // Fetch all categories once and cache them (this should not change during search)
  const { data: allCategoriesData, isPending, error } = useQuery({
    queryKey: ['categories'],
    queryFn: () => {
      console.log('Fetching all categories')
      return db.categories.list()
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  })

  const allCategories = allCategoriesData?.documents || []
  
  // Debug logging
  console.log('Categories query result:', { isPending, error, allCategoriesData, allCategories })

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
    if (selectedCategoryIds.includes(categoryId)) {
      onCategoriesChange(selectedCategoryIds.filter(id => id !== categoryId))
    } else {
      onCategoriesChange([...selectedCategoryIds, categoryId])
    }
  }

  const handleCategoryRemove = (categoryId: string) => {
    onCategoriesChange(selectedCategoryIds.filter(id => id !== categoryId))
  }

  const handleDragEnd = (event: DragEndEvent) => {
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
    <div className="space-y-2">
      <Label>Categories</Label>
      
      {/* Selected categories with drag and drop */}
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
            {selectedCategories.map((category) => (
              <SortableCategoryItem
                key={category.$id}
                category={category}
                onRemove={handleCategoryRemove}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Category selector popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedCategoryIds.length > 0
              ? `${selectedCategoryIds.length} categor${selectedCategoryIds.length === 1 ? 'y' : 'ies'} selected`
              : "Select categories..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
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

      {/* New category modal */}
      <NewCategoryModal 
        open={showNewCategoryModal} 
        onOpenChange={setShowNewCategoryModal}
        onCategoryCreated={(categoryId) => {
          onCategoriesChange([...selectedCategoryIds, categoryId])
          setShowNewCategoryModal(false)
        }}
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
        />
      )}
    </div>
  )
}

interface NewCategoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCategoryCreated: (categoryId: string) => void
}

function NewCategoryModal({ open, onOpenChange, onCategoryCreated }: NewCategoryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  })

  const qc = useQueryClient()

  const createCategory = useMutation({
    mutationFn: async (data: Omit<Categories, keyof Models.Document>) => {
      console.log('Creating category with data:', data)
      // Ensure no ID is accidentally passed
      const cleanData = { ...data }
      delete (cleanData as any).$id
      delete (cleanData as any).id
      console.log('Clean data for creation:', cleanData)
      return db.categories.create(cleanData)
    },
    onSuccess: (newCategory) => {
      qc.invalidateQueries({ queryKey: ['categories'] })
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
}

function EditCategoryModal({ category, open, onOpenChange, onCategoryUpdated }: EditCategoryModalProps) {
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
      qc.invalidateQueries({ queryKey: ['categories'] })
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
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateCategory.isPending}>
              {updateCategory.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Category
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

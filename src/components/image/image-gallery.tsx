import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '@/lib/appwrite/db'
import { files } from '@/lib/appwrite/storage'
import type { Images } from '@/lib/appwrite/appwrite.types'
import { type Models, Query, Permission, Role } from 'appwrite'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Check, ChevronsUpDown, Plus, X, Settings, Loader2, Upload, GripVertical, Trash2 } from 'lucide-react'
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
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface ImageGalleryProps {
  selectedImageIds: string[]
  onImagesChange: (imageIds: string[]) => void
  userId: string
}

interface SortableImageItemProps {
  image: Images
  onRemove: (imageId: string) => void
}

function SortableImageItem({ image, onRemove }: SortableImageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.$id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const previewUrl = String(files.getPreview(image.file, 400, 300))

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group w-full",
        isDragging && "opacity-50"
      )}
    >
      <div className="w-full relative aspect-ratio-container aspect-ratio-fallback" style={{ aspectRatio: '4/3', maxHeight: '200px' }}>
        <img 
          src={previewUrl} 
          alt={image.caption || 'Image'} 
          className="w-full h-full object-cover rounded-lg border"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
          <div className="absolute top-2 left-2">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-white/20 rounded"
            >
              <GripVertical className="h-4 w-4 text-white drop-shadow-sm" />
            </div>
          </div>
          <div className="absolute top-2 right-2">
            <button
              className="h-5 w-5 rounded-full bg-background/90 border-2 border-background/90 flex items-center justify-center hover:bg-background transition-colors backdrop-blur-sm cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                onRemove(image.$id)
              }}
            >
              <X className="h-3 w-3 text-foreground" />
            </button>
          </div>
          <div className="absolute bottom-2 left-2 right-2">
            <div className="text-white text-xs truncate drop-shadow-sm">
              {image.caption || 'Untitled Image'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ImageGallery({ selectedImageIds, onImagesChange, userId }: ImageGalleryProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [showNewImageModal, setShowNewImageModal] = useState(false)
  const [editingImage, setEditingImage] = useState<Images | null>(null)
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

  // Fetch images for the current blog
  const { data: allImagesData, isPending, error } = useQuery({
    queryKey: ['images', currentBlog?.$id],
    queryFn: async () => {
      console.log('Fetching images for blog:', currentBlog?.$id)
      if (!currentBlog?.$id) return { documents: [], total: 0 }
      return db.images.list([
        Query.equal('blogId', currentBlog.$id)
      ])
    },
    enabled: !!currentBlog?.$id,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  })

  const allImages = allImagesData?.documents || []
  
  // Debug logging
  console.log('Images query result:', { isPending, error, allImagesData, allImages })

  // Memoize selected images to prevent unnecessary re-renders
  const selectedImages = useMemo(() => {
    return selectedImageIds
      .map(id => allImages.find(image => image.$id === id))
      .filter((image): image is Images => image !== undefined)
  }, [allImages, selectedImageIds])

  // Memoize filtered images for search
  const filteredImages = useMemo(() => {
    if (!debouncedSearchValue.trim()) return allImages
    
    return allImages.filter(image => {
      const searchTerm = debouncedSearchValue.toLowerCase()
      return (image.caption && image.caption.toLowerCase().includes(searchTerm)) ||
             (image.credits && image.credits.toLowerCase().includes(searchTerm)) ||
             (image.file && image.file.toLowerCase().includes(searchTerm))
    })
  }, [allImages, debouncedSearchValue])

  // No more skeleton - just show empty state during loading

  const handleImageSelect = (imageId: string) => {
    if (selectedImageIds.includes(imageId)) {
      onImagesChange(selectedImageIds.filter(id => id !== imageId))
    } else {
      onImagesChange([...selectedImageIds, imageId])
    }
  }

  const handleImageRemove = (imageId: string) => {
    onImagesChange(selectedImageIds.filter(id => id !== imageId))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = selectedImageIds.indexOf(active.id as string)
      const newIndex = selectedImageIds.indexOf(over.id as string)

      onImagesChange(arrayMove(selectedImageIds, oldIndex, newIndex))
    }
  }

  // Memoize the image list items
  const imageListItems = useMemo(() => {
    return filteredImages.map(image => {
      // Use high resolution for crisp quality: 160x120 for 4:3 ratio (80x60 display size)
      const previewUrl = String(files.getPreview(image.file, 160, 120))
      
      return (
        <CommandItem
          key={image.$id}
          value={image.$id}
          onSelect={() => handleImageSelect(image.$id)}
          className="flex items-center justify-between group p-2"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src={previewUrl} 
                alt={image.caption || 'Image'} 
                className="w-20 h-15 object-cover rounded-lg border"
                loading="lazy"
                decoding="async"
              />
              <Check
                className={cn(
                  "absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground rounded-full p-0.5",
                  selectedImageIds.includes(image.$id) ? "opacity-100" : "opacity-0"
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {image.caption || 'Untitled Image'}
              </div>
              {image.credits && (
                <div className="text-xs text-muted-foreground truncate">
                  {image.credits}
                </div>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 cursor-pointer hover:bg-accent"
            onClick={(e) => {
              e.stopPropagation()
              setEditingImage(image)
              setOpen(false)
            }}
          >
            <Settings className="h-3 w-3" />
          </Button>
        </CommandItem>
      )
    })
  }, [filteredImages, selectedImageIds, handleImageSelect])

  // Memoize the selected images display
  const selectedImagesDisplay = useMemo(() => {
    if (selectedImages.length > 0) {
      return (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={selectedImageIds} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {selectedImages.map(image => (
                <SortableImageItem
                  key={image.$id}
                  image={image}
                  onRemove={handleImageRemove}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )
    }
    
    return (
      <div className="w-full">
        <div className="w-full h-20 border border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center text-muted-foreground min-h-[92px]">
          <p className="text-sm">
            {isPending ? 'Loading images...' : 'No images selected'}
          </p>
        </div>
      </div>
    )
  }, [isPending, selectedImages, selectedImageIds, sensors, handleImageRemove, handleDragEnd])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-0">
        <Label>Images</Label>
      </div>
      
      {/* Selected images display */}
      {selectedImagesDisplay}

      {/* Image selection popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={isPending}
          >
            {selectedImages.length > 0 ? (
              `${selectedImages.length} image${selectedImages.length > 1 ? 's' : ''} selected`
            ) : (
              isPending ? "Loading..." : "Select images..."
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
          <Command shouldFilter={false}>
            <div className="relative">
              <CommandInput 
                placeholder="Search images..." 
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
            <CommandList className="min-h-[200px] max-h-[400px]">
              {isPending ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading images...</span>
                  </div>
                </div>
              ) : filteredImages.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-2">
                    {debouncedSearchValue.trim() ? 'No images found' : 'No images available'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setOpen(false)
                      setShowNewImageModal(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add new image
                  </Button>
                </div>
              ) : (
                <CommandGroup>
                  {imageListItems}
                  <CommandItem
                    onSelect={() => {
                      setOpen(false)
                      setShowNewImageModal(true)
                    }}
                    className="text-primary"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add new image
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* New image modal */}
      <NewImageModal 
        open={showNewImageModal} 
        onOpenChange={setShowNewImageModal}
        onImageCreated={(imageId) => {
          onImagesChange([...selectedImageIds, imageId])
          setShowNewImageModal(false)
        }}
        userId={userId}
      />

      {/* Edit image modal */}
      {editingImage && (
        <EditImageModal 
          image={editingImage}
          open={!!editingImage} 
          onOpenChange={(open) => !open && setEditingImage(null)}
          onImageUpdated={() => {
            setEditingImage(null)
          }}
          userId={userId}
        />
      )}
    </div>
  )
}

interface NewImageModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImageCreated: (imageId: string) => void
  userId: string
}

function NewImageModal({ open, onOpenChange, onImageCreated, userId }: NewImageModalProps) {
  const [formData, setFormData] = useState({
    caption: '',
    credits: '',
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const qc = useQueryClient()
  const { currentBlog, currentTeam } = useTeamBlog(userId)

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const createImage = useMutation({
    mutationFn: async (data: Omit<Images, keyof Models.Document>) => {
      console.log('Creating image with data:', data)
      // Ensure no ID is accidentally passed
      const cleanData = { ...data }
      delete (cleanData as any).$id
      delete (cleanData as any).id
      console.log('Clean data for creation:', cleanData)
      return db.images.create(cleanData, currentTeam?.$id)
    },
    onSuccess: (newImage) => {
      qc.invalidateQueries({ queryKey: ['images', currentBlog?.$id] })
      toast({ title: 'Image created successfully' })
      onImageCreated(newImage.$id)
      setFormData({
        caption: '',
        credits: '',
      })
      setSelectedFile(null)
      setPreviewUrl(null)
    },
    onError: (error: any) => {
      console.error('Image creation error:', error)
      toast({ 
        title: 'Failed to create image', 
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive' 
      })
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      toast({ title: 'Please select a file', variant: 'destructive' })
      return
    }
    
    setUploading(true)
    try {
      // Upload file to storage with team permissions
      const teamPermissions = currentTeam?.$id ? [
        Permission.read(Role.team(currentTeam.$id)),
        Permission.update(Role.team(currentTeam.$id)),
        Permission.delete(Role.team(currentTeam.$id))
      ] : undefined
      
      const uploadedFile = await files.upload(selectedFile, selectedFile.name, teamPermissions)
      
      // Create image record in database
      const cleanedData: Omit<Images, keyof Models.Document> = {
        file: uploadedFile.$id,
        caption: formData.caption.trim() || null,
        credits: formData.credits.trim() || null,
        blogId: currentBlog?.$id || null,
      }
      
      console.log('Form data before submission:', cleanedData)
      createImage.mutate(cleanedData)
    } catch (error) {
      console.error('Upload error:', error)
      toast({ 
        title: 'Upload failed', 
        description: 'Failed to upload the image file',
        variant: 'destructive' 
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Image</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Image File *</Label>
            <div className="space-y-2">
              {previewUrl ? (
                <div className="relative">
                  <div className="w-full relative aspect-ratio-container aspect-ratio-fallback" style={{ aspectRatio: '4/3' }}>
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover rounded-lg border"
                      loading="eager"
                      decoding="async"
                    />
                    <button
                      type="button"
                      className="absolute top-2 right-2 h-5 w-5 rounded-full bg-black border-2 border-white flex items-center justify-center hover:bg-white transition-colors"
                      onClick={() => {
                        setSelectedFile(null)
                        setPreviewUrl(null)
                      }}
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop an image here, or click to browse
                  </p>
                  <input
                    id="file"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileSelect(file)
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('file')?.click()}
                  >
                    Browse Files
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              value={formData.caption}
              onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
              placeholder="Image caption..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="credits">Credits</Label>
            <Input
              id="credits"
              value={formData.credits}
              onChange={(e) => setFormData(prev => ({ ...prev, credits: e.target.value }))}
              placeholder="Photo by John Doe"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createImage.isPending || uploading || !selectedFile}>
              {createImage.isPending || uploading ? 'Creating...' : 'Create Image'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface EditImageModalProps {
  image: Images
  open: boolean
  onOpenChange: (open: boolean) => void
  onImageUpdated: () => void
  userId: string
}

function EditImageModal({ image, open, onOpenChange, onImageUpdated, userId }: EditImageModalProps) {
  const [formData, setFormData] = useState({
    caption: image.caption || '',
    credits: image.credits || '',
  })

  const qc = useQueryClient()
  const { currentBlog } = useTeamBlog(userId)

  const updateImage = useMutation({
    mutationFn: async (data: Partial<Omit<Images, keyof Models.Document>>) => {
      return db.images.update(image.$id, data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['images', currentBlog?.$id] })
      toast({ title: 'Image updated successfully' })
      onImageUpdated()
      onOpenChange(false)
    },
    onError: (error: any) => {
      console.error('Image update error:', error)
      toast({ 
        title: 'Failed to update image', 
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive' 
      })
    },
  })

  const deleteImage = useMutation({
    mutationFn: async () => {
      return db.images.delete(image.$id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['images', currentBlog?.$id] })
      toast({ title: 'Image deleted successfully' })
      onImageUpdated()
      onOpenChange(false)
    },
    onError: (error: any) => {
      console.error('Image deletion error:', error)
      toast({ 
        title: 'Failed to delete image', 
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive' 
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clean up empty strings
    const cleanedData: Partial<Omit<Images, keyof Models.Document>> = {
      caption: formData.caption.trim() || null,
      credits: formData.credits.trim() || null,
    }
    
    updateImage.mutate(cleanedData)
  }

  // Use 2x size for retina display: 400x300 for 4:3 ratio (200x150 display size)
  const previewUrl = String(files.getPreview(image.file, 400, 300))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Image</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Image Preview</Label>
            <div className="w-full relative aspect-ratio-container aspect-ratio-fallback" style={{ aspectRatio: '4/3' }}>
              <img 
                src={previewUrl} 
                alt={image.caption || 'Image'} 
                className="w-full h-full object-cover rounded-lg border"
                loading="eager"
                decoding="async"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-caption">Caption</Label>
            <Textarea
              id="edit-caption"
              value={formData.caption}
              onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
              placeholder="Image caption..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="edit-credits">Credits</Label>
            <Input
              id="edit-credits"
              value={formData.credits}
              onChange={(e) => setFormData(prev => ({ ...prev, credits: e.target.value }))}
              placeholder="Photo by John Doe"
            />
          </div>

          <div className="flex justify-between pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" disabled={deleteImage.isPending} className="bg-red-600 text-white hover:bg-red-700">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleteImage.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the image and remove all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteImage.mutate()}
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
              <Button type="submit" disabled={updateImage.isPending}>
                {updateImage.isPending ? 'Updating...' : 'Update Image'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

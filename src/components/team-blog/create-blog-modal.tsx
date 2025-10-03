import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '@/lib/appwrite/db'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog'
import { 
  Plus, 
  X, 
  FileText,
  Loader2 
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { ID } from 'appwrite'

interface CreateBlogModalProps {
  isOpen: boolean
  onClose: () => void
  teamId: string
  userId: string
  onBlogCreated?: (blog: any) => void
}

export function CreateBlogModal({ isOpen, onClose, teamId, userId, onBlogCreated }: CreateBlogModalProps) {
  const [blogName, setBlogName] = useState('')
  const [blogDescription, setBlogDescription] = useState('')
  const [blogSlug, setBlogSlug] = useState('')
  const [blogDomain, setBlogDomain] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const queryClient = useQueryClient()

  const createBlogMutation = useMutation({
    mutationFn: async () => {
      const slug = blogSlug.trim() || blogName.toLowerCase().replace(/\s+/g, '-')
      
      const blogData = {
        name: blogName,
        slug: slug,
        description: blogDescription || null,
        domain: blogDomain || null,
        logo: null,
        favicon: null,
        theme: null,
        settings: null,
        ownerId: userId,
        teamId: teamId,
        status: 'active',
        seoTitle: null,
        seoDescription: null,
        seoKeywords: null
      }

      return await db.blogs.create(blogData, teamId)
    },
    onSuccess: (blog) => {
      queryClient.invalidateQueries({ queryKey: ['blogs', teamId] })
      toast({ title: 'Blog created successfully!' })
      // Call the callback to set the new blog as current
      if (onBlogCreated) {
        onBlogCreated(blog)
      }
      handleClose()
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to create blog', 
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  const handleClose = () => {
    setBlogName('')
    setBlogDescription('')
    setBlogSlug('')
    setBlogDomain('')
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!blogName.trim()) return

    setIsCreating(true)
    try {
      await createBlogMutation.mutateAsync()
    } finally {
      setIsCreating(false)
    }
  }

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  const handleNameChange = (value: string) => {
    setBlogName(value)
    if (!blogSlug) {
      setBlogSlug(generateSlug(value))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Create New Blog
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="blog-name">Blog Name *</Label>
              <Input
                id="blog-name"
                value={blogName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Enter blog name"
                required
              />
            </div>

            <div>
              <Label htmlFor="blog-slug">URL Slug</Label>
              <Input
                id="blog-slug"
                value={blogSlug}
                onChange={(e) => setBlogSlug(e.target.value)}
                placeholder="blog-url-slug"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Auto-generated from blog name if left empty
              </p>
            </div>

            <div>
              <Label htmlFor="blog-description">Description</Label>
              <Textarea
                id="blog-description"
                value={blogDescription}
                onChange={(e) => setBlogDescription(e.target.value)}
                placeholder="Describe your blog's purpose and content"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="blog-domain">Custom Domain (Optional)</Label>
              <Input
                id="blog-domain"
                value={blogDomain}
                onChange={(e) => setBlogDomain(e.target.value)}
                placeholder="example.com"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to use the default domain
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!blogName.trim() || isCreating}
              className="flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Create Blog
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

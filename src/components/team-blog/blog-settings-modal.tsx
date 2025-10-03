import { useState, useEffect } from 'react'
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
  Loader2,
  Save
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import type { Blogs } from '@/lib/appwrite/appwrite.types'

interface BlogSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  blog: Blogs | null
  userId: string
}

export function BlogSettingsModal({ isOpen, onClose, blog, userId }: BlogSettingsModalProps) {
  const [blogName, setBlogName] = useState('')
  const [blogSlug, setBlogSlug] = useState('')
  const [blogDescription, setBlogDescription] = useState('')
  const [blogDomain, setBlogDomain] = useState('')
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const queryClient = useQueryClient()

  // Initialize form with blog data
  useEffect(() => {
    if (blog) {
      setBlogName(blog.name || '')
      setBlogSlug(blog.slug || '')
      setBlogDescription(blog.description || '')
      setBlogDomain(blog.domain || '')
      setSeoTitle(blog.seoTitle || '')
      setSeoDescription(blog.seoDescription || '')
    }
  }, [blog])

  const updateBlogMutation = useMutation({
    mutationFn: async () => {
      if (!blog) throw new Error('No blog selected')
      
      // Update blog in Appwrite
      await db.blogs.update(blog.$id, {
        name: blogName,
        slug: blogSlug,
        description: blogDescription || null,
        domain: blogDomain || null,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
      }, blog.teamId)
      
      return blog
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs', blog?.teamId] })
      toast({ title: 'Blog updated successfully!' })
      handleClose()
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to update blog', 
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  const handleClose = () => {
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!blogName.trim() || !blogSlug.trim()) return

    setIsUpdating(true)
    try {
      await updateBlogMutation.mutateAsync()
    } finally {
      setIsUpdating(false)
    }
  }

  if (!blog) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Blog Settings
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="blog-name">Blog Name *</Label>
                <Input
                  id="blog-name"
                  value={blogName}
                  onChange={(e) => setBlogName(e.target.value)}
                  placeholder="Enter blog name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="blog-slug">Blog Slug *</Label>
                <Input
                  id="blog-slug"
                  value={blogSlug}
                  onChange={(e) => setBlogSlug(e.target.value)}
                  placeholder="blog-slug"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="blog-description">Description</Label>
              <Textarea
                id="blog-description"
                value={blogDescription}
                onChange={(e) => setBlogDescription(e.target.value)}
                placeholder="Enter blog description"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="blog-domain">Domain</Label>
              <Input
                id="blog-domain"
                value={blogDomain}
                onChange={(e) => setBlogDomain(e.target.value)}
                placeholder="example.com"
              />
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium">SEO Settings</h4>
              <div>
                <Label htmlFor="seo-title">SEO Title</Label>
                <Input
                  id="seo-title"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="SEO optimized title"
                />
              </div>
              <div>
                <Label htmlFor="seo-description">SEO Description</Label>
                <Textarea
                  id="seo-description"
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="SEO optimized description"
                  rows={2}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!blogName.trim() || !blogSlug.trim() || isUpdating}
              className="flex items-center gap-2"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

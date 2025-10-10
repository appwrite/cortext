import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { db } from '@/lib/appwrite/db'
import { getTeamsClient } from '@/lib/appwrite'
import { Query } from 'appwrite'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { StandardAvatar } from '@/components/ui/standard-avatar'
import { 
  Search, 
  Plus, 
  Users, 
  FileText, 
  Building2,
  Settings
} from 'lucide-react'
import { useTeamBlog } from '@/hooks/use-team-blog'
import { useTeamBlogContext } from '@/contexts/team-blog-context'
import { cn, truncateText } from '@/lib/utils'
import type { Blogs } from '@/lib/appwrite/appwrite.types'

interface TeamBlogDropdownProps {
  userId: string
  onClose: () => void
  onCreateTeam: () => void
  onCreateBlog: (teamId: string) => void
  onTeamSettings: (team: any) => void
  onBlogSettings: (blog: Blogs) => void
  setCurrentTeam: (team: any) => void
  setCurrentBlog: (blog: any) => void
  onBlogSelect?: () => void
  isOpen?: boolean
}

export function TeamBlogDropdown({ userId, onClose, onCreateTeam, onCreateBlog, onTeamSettings, onBlogSettings, setCurrentTeam, setCurrentBlog, onBlogSelect, isOpen }: TeamBlogDropdownProps) {
  const [teamSearch, setTeamSearch] = useState('')
  const [blogSearch, setBlogSearch] = useState('')
  const { currentTeam, currentBlog, teams, isLoadingTeams } = useTeamBlogContext()
  
  // Initialize with current team from top nav
  const [selectedTeamForBlogs, setSelectedTeamForBlogs] = useState<any>(currentTeam)
  
  // Get blogs for the selected team in dropdown (not necessarily current team)
  const { data: blogs, isLoading: isLoadingBlogs } = useQuery({
    queryKey: ['blogs', selectedTeamForBlogs?.$id],
    queryFn: async () => {
      if (!selectedTeamForBlogs?.$id) return []
      const res = await db.blogs.list([
        Query.equal('teamId', selectedTeamForBlogs.$id),
        Query.equal('status', 'active'),
        Query.orderDesc('$createdAt')
      ])
      return res.documents
    },
    enabled: !!selectedTeamForBlogs?.$id,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  })
  
  // Refs for scroll containers
  const teamsScrollRef = useRef<HTMLDivElement>(null)
  const blogsScrollRef = useRef<HTMLDivElement>(null)
  
  // Track if we've already scrolled on this popover open
  const hasScrolledOnOpen = useRef(false)

  // Update selected team when current team changes
  useEffect(() => {
    setSelectedTeamForBlogs(currentTeam)
  }, [currentTeam])

  // Teams and blogs data now come from shared context

  // Filter teams and blogs based on search
  const filteredTeams = teams?.filter(team => 
    team.name.toLowerCase().includes(teamSearch.toLowerCase())
  ) || []

  const filteredBlogs = blogs?.filter(blog => 
    blog.name.toLowerCase().includes(blogSearch.toLowerCase())
  ) || []

  // Reset scroll flag when popover closes
  useEffect(() => {
    if (!isOpen) {
      hasScrolledOnOpen.current = false
    }
  }, [isOpen])

  // Scroll to selected team when popover opens (only once)
  useEffect(() => {
    if (isOpen && !hasScrolledOnOpen.current && teamsScrollRef.current && currentTeam && filteredTeams.length > 0) {
      const selectedTeamElement = teamsScrollRef.current.querySelector(`[data-team-id="${currentTeam.$id}"]`)
      if (selectedTeamElement) {
        selectedTeamElement.scrollIntoView({ 
          behavior: 'instant', 
          block: 'center' 
        })
        hasScrolledOnOpen.current = true
      }
    }
  }, [isOpen, currentTeam, filteredTeams])

  // Scroll to selected blog when popover opens (only once)
  useEffect(() => {
    if (isOpen && !hasScrolledOnOpen.current && blogsScrollRef.current && currentBlog && filteredBlogs.length > 0) {
      const selectedBlogElement = blogsScrollRef.current.querySelector(`[data-blog-id="${currentBlog.$id}"]`)
      if (selectedBlogElement) {
        selectedBlogElement.scrollIntoView({ 
          behavior: 'instant', 
          block: 'center' 
        })
        hasScrolledOnOpen.current = true
      }
    }
  }, [isOpen, currentBlog, filteredBlogs])

  const handleTeamSelect = (team: any) => {
    // Only update local state for blog list filtering
    setSelectedTeamForBlogs(team)
    setBlogSearch('')
    // Don't close the dropdown - just update the blog list
  }

  // Determine which team should be highlighted as selected
  const getSelectedTeam = () => {
    return selectedTeamForBlogs || currentTeam
  }

  const handleBlogSelect = (blog: Blogs) => {
    // Find the team that owns this blog
    const team = teams?.find(t => t.$id === blog.teamId)
    if (team) {
      setCurrentTeam(team)
    }
    setCurrentBlog(blog)
    onClose()
    
    // Call the optional callback for navigation
    if (onBlogSelect) {
      onBlogSelect()
    }
  }

  const handleCreateTeam = () => {
    onCreateTeam()
  }

  const handleCreateBlog = () => {
    // Pass the locally selected team ID to the create blog handler
    if (selectedTeamForBlogs?.$id) {
      onCreateBlog(selectedTeamForBlogs.$id)
    } else {
      onCreateBlog('')
    }
  }

  const handleTeamSettings = (team: any, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent team selection
    onTeamSettings(team)
  }

  const handleBlogSettings = (blog: Blogs, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent blog selection
    onBlogSettings(blog)
  }

  return (
    <div className="flex h-[400px]">
      {/* Teams Section */}
      <div className="flex-1 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Find Team..."
              value={teamSearch}
              onChange={(e) => setTeamSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
        <div className="p-4 flex-1 flex flex-col min-h-0">
          <h3 className="text-sm font-medium border-b pt-2 pb-2">Teams</h3>
          <ScrollArea className="flex-1" ref={teamsScrollRef}>
            <div className="pt-2 pb-2">
            {filteredTeams.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-4">
                  {teamSearch ? 'No teams found' : 'No teams yet'}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreateTeam}
                  className="w-full cursor-pointer"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Team
                </Button>
              </div>
            ) : (
              <div className="space-y-0.5">
                {filteredTeams.map((team) => {
                  const isSelected = getSelectedTeam()?.$id === team.$id
                  return (
                    <div
                      key={team.$id}
                      data-team-id={team.$id}
                      onClick={() => handleTeamSelect(team)}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors hover:bg-accent",
                        isSelected && "bg-accent"
                      )}
                    >
                    <StandardAvatar 
                      className="w-6 h-6 flex-shrink-0"
                      initials={team.name.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase()}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" title={team.name}>
                        {truncateText(team.name, 25)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleTeamSettings(team, e)}
                      className="h-6 w-6 p-0 hover:bg-accent cursor-pointer"
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                    </div>
                  )
                })}
              </div>
            )}
            </div>
          </ScrollArea>
          
          {/* Create Team Button - Sticky to bottom */}
          <div className="px-2 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateTeam}
              className="w-full justify-start cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          </div>
        </div>
      </div>

      {/* Blogs Section */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Find Blog..."
              value={blogSearch}
              onChange={(e) => setBlogSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
        <div className="p-4 flex-1 flex flex-col min-h-0">
          <h3 className="text-sm font-medium border-b pt-2 pb-2">Blogs</h3>
          <ScrollArea className="flex-1" ref={blogsScrollRef}>
            <div className="pt-2 pb-2">
            {!selectedTeamForBlogs ? (
              <div className="text-center py-8">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Select a team to view blogs
                </p>
              </div>
            ) : isLoadingBlogs ? (
              <div className="h-full min-h-[200px]"></div>
            ) : filteredBlogs.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[200px]">
                <p className="text-sm text-muted-foreground">
                  {blogSearch ? 'No blogs found' : 'No blogs yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {filteredBlogs.map((blog) => (
                  <div
                    key={blog.$id}
                    data-blog-id={blog.$id}
                    onClick={() => handleBlogSelect(blog)}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors hover:bg-accent",
                      currentBlog?.$id === blog.$id && "bg-accent"
                    )}
                  >
                    <StandardAvatar 
                      className="w-6 h-6 flex-shrink-0"
                      initials={blog.name.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase()}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" title={blog.name}>
                        {truncateText(blog.name, 25)}
                      </p>
                      {blog.description && (
                        <p className="text-xs text-muted-foreground" title={blog.description}>
                          {truncateText(blog.description, 30)}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleBlogSettings(blog, e)}
                      className="h-6 w-6 p-0 hover:bg-accent cursor-pointer"
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            </div>
          </ScrollArea>
          
          {/* Create Blog Button - Sticky to bottom */}
          <div className="px-2 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateBlog}
              className="w-full justify-start cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Blog
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

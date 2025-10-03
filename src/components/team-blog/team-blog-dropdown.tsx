import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { db } from '@/lib/appwrite/db'
import { getTeamsClient, getAvatarsClient } from '@/lib/appwrite'
import { Query } from 'appwrite'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
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
import { cn } from '@/lib/utils'
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
}

export function TeamBlogDropdown({ userId, onClose, onCreateTeam, onCreateBlog, onTeamSettings, onBlogSettings, setCurrentTeam, setCurrentBlog, onBlogSelect }: TeamBlogDropdownProps) {
  const [teamSearch, setTeamSearch] = useState('')
  const [blogSearch, setBlogSearch] = useState('')
  const { currentTeam, currentBlog } = useTeamBlogContext()
  
  // Initialize with current team from top nav
  const [selectedTeamForBlogs, setSelectedTeamForBlogs] = useState<any>(currentTeam)

  // Update selected team when current team changes
  useEffect(() => {
    if (currentTeam && !selectedTeamForBlogs) {
      setSelectedTeamForBlogs(currentTeam)
    }
  }, [currentTeam, selectedTeamForBlogs])

  // Load teams using Appwrite Teams API
  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ['teams', userId],
    queryFn: async () => {
      const teamsClient = getTeamsClient()
      const res = await teamsClient.list()
      return res.teams
    },
    enabled: !!userId
  })

  // Get blogs for the locally selected team
  const { data: blogs, isLoading: blogsLoading } = useQuery({
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
    enabled: !!selectedTeamForBlogs?.$id
  })

  // Filter teams and blogs based on search
  const filteredTeams = teams?.filter(team => 
    team.name.toLowerCase().includes(teamSearch.toLowerCase())
  ) || []

  const filteredBlogs = blogs?.filter(blog => 
    blog.name.toLowerCase().includes(blogSearch.toLowerCase())
  ) || []

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
          <ScrollArea className="flex-1">
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
                      onClick={() => handleTeamSelect(team)}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors hover:bg-accent",
                        isSelected && "bg-accent"
                      )}
                    >
                    <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                      <img 
                        src={getAvatarsClient().getInitials(team.name, 64, 64)} 
                        alt={team.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{team.name}</p>
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
          <ScrollArea className="flex-1">
            <div className="pt-2 pb-2">
            {!selectedTeamForBlogs ? (
              <div className="text-center py-8">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Select a team to view blogs
                </p>
              </div>
            ) : blogsLoading ? (
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
                    onClick={() => handleBlogSelect(blog)}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors hover:bg-accent",
                      currentBlog?.$id === blog.$id && "bg-accent"
                    )}
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                      <img 
                        src={getAvatarsClient().getInitials(blog.name, 64, 64)} 
                        alt={blog.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{blog.name}</p>
                      {blog.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {blog.description}
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

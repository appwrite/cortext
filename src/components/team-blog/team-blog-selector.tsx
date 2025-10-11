import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { StandardAvatar } from '@/components/ui/standard-avatar'
import { ChevronDown, Plus, Users, FileText } from 'lucide-react'
import { TeamBlogDropdown } from './team-blog-dropdown'
import { CreateTeamModal } from './create-team-modal'
import { CreateBlogModal } from './create-blog-modal'
import { TeamSettingsModal } from './team-settings-modal'
import { BlogSettingsModal } from './blog-settings-modal'
import { useTeamBlog } from '@/hooks/use-team-blog'
import { useTeamBlogContext } from '@/contexts/team-blog-context'
import { getTeamsClient } from '@/lib/appwrite'
import { cn, truncateText } from '@/lib/utils'

interface TeamBlogSelectorProps {
  userId: string
}

export function TeamBlogSelector({ userId }: TeamBlogSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false)
  const [showCreateBlogModal, setShowCreateBlogModal] = useState(false)
  const [showTeamSettingsModal, setShowTeamSettingsModal] = useState(false)
  const [showBlogSettingsModal, setShowBlogSettingsModal] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<any>(null)
  const [selectedBlog, setSelectedBlog] = useState<any>(null)
  const [selectedTeamForBlog, setSelectedTeamForBlog] = useState<string>('')
  const containerRef = useRef<HTMLDivElement>(null)
  const { currentTeam, currentBlog, setCurrentTeam, setCurrentBlog, teams } = useTeamBlogContext()
  const navigate = useNavigate()

  // Teams data now comes from shared context

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const getButtonText = () => {
    if (!currentTeam) {
      return 'Create Team'
    }
    if (!currentBlog) {
      return `${truncateText(currentTeam.name, 15)} / Create Blog`
    }
    return `${truncateText(currentTeam.name, 15)} / ${truncateText(currentBlog.name, 15)}`
  }

  const getButtonIcon = () => {
    if (!currentTeam) {
      return <Plus className="h-4 w-4" />
    }
    if (!currentBlog) {
      return <FileText className="h-4 w-4" />
    }
    return (
      <StandardAvatar 
        className="w-6 h-6"
        initials={currentBlog.name.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase()}
      />
    )
  }

  const handleTeamSettings = (team: any) => {
    setSelectedTeam(team)
    setShowTeamSettingsModal(true)
    setIsOpen(false)
  }

  const handleBlogSettings = (blog: any) => {
    setSelectedBlog(blog)
    setShowBlogSettingsModal(true)
    setIsOpen(false)
  }

  const [selectedTeamForBlogCreation, setSelectedTeamForBlogCreation] = useState<any>(null)

  const handleCreateBlog = (teamId: string) => {
    setSelectedTeamForBlog(teamId)
    // Store the team info for when the blog is created
    const team = teams?.find(t => t.$id === teamId)
    setSelectedTeamForBlogCreation(team)
    setShowCreateBlogModal(true)
    setIsOpen(false)
  }

  const handleBlogCreated = (blog: any) => {
    // Update both team and blog states
    if (selectedTeamForBlogCreation) {
      setCurrentTeam(selectedTeamForBlogCreation)
    }
    setCurrentBlog(blog)
  }

  const handleBlogSelect = () => {
    // Navigate to main content when a blog is selected
    navigate({ to: '/content', search: {} })
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-medium hover:bg-accent cursor-pointer"
      >
        {getButtonIcon()}
        <span className="hidden sm:inline">{getButtonText()}</span>
        <span className="sm:hidden">
          {currentTeam ? truncateText(currentTeam.name, 10) : 'Team'}
        </span>
        <ChevronDown className="h-4 w-4" />
      </Button>
      
      {isOpen && (
        <>
          {/* Arrow pointing to the button */}
          <div className="absolute left-6 sm:left-6 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-border z-50" />
          <div className="absolute left-0 sm:left-0 top-full mt-1 w-[80vw] sm:w-[600px] max-w-[600px] bg-background border rounded-lg shadow-lg z-50 animate-in fade-in-0 zoom-in-95 duration-200">
                    <TeamBlogDropdown
                      userId={userId}
                      onClose={() => setIsOpen(false)}
                      onCreateTeam={() => {
                        setShowCreateTeamModal(true)
                        setIsOpen(false)
                      }}
                      onCreateBlog={handleCreateBlog}
                      onTeamSettings={handleTeamSettings}
                      onBlogSettings={handleBlogSettings}
                      setCurrentTeam={setCurrentTeam}
                      setCurrentBlog={setCurrentBlog}
                      onBlogSelect={handleBlogSelect}
                      isOpen={isOpen}
                    />
          </div>
        </>
      )}

              <CreateTeamModal
                isOpen={showCreateTeamModal}
                onClose={() => setShowCreateTeamModal(false)}
                userId={userId}
                onTeamCreated={(team, blog) => {
                  setCurrentTeam(team)
                  setCurrentBlog(blog)
                }}
              />

      <CreateBlogModal
        isOpen={showCreateBlogModal}
        onClose={() => setShowCreateBlogModal(false)}
        teamId={selectedTeamForBlog || currentTeam?.$id || ''}
        userId={userId}
        onBlogCreated={handleBlogCreated}
      />

      <TeamSettingsModal
        isOpen={showTeamSettingsModal}
        onClose={() => setShowTeamSettingsModal(false)}
        team={selectedTeam}
        userId={userId}
      />

      <BlogSettingsModal
        isOpen={showBlogSettingsModal}
        onClose={() => setShowBlogSettingsModal(false)}
        blog={selectedBlog}
        userId={userId}
      />
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { StandardAvatar } from '@/components/ui/standard-avatar'
import { ChevronDown, Plus, FileText } from 'lucide-react'
import { TeamBlogDropdown } from './team-blog-dropdown'
import { CreateTeamModal } from './create-team-modal'
import { CreateBlogModal } from './create-blog-modal'
import { TeamSettingsModal } from './team-settings-modal'
import { BlogSettingsModal } from './blog-settings-modal'
import { useTeamBlogContext } from '@/contexts/team-blog-context'
import { truncateText } from '@/lib/utils'

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
  const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { currentTeam, currentBlog, setCurrentTeam, setCurrentBlog, teams } = useTeamBlogContext()
  const navigate = useNavigate()

  // Update button position when dropdown opens or on scroll
  useEffect(() => {
    const updatePosition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        setButtonPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX
        })
      }
    }

    if (isOpen) {
      updatePosition()
      const handleScroll = () => updatePosition()
      window.addEventListener('scroll', handleScroll, true)
      return () => window.removeEventListener('scroll', handleScroll, true)
    }
  }, [isOpen])

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

  const handleButtonClick = () => {
    // Toggle the dropdown
    setIsOpen(!isOpen)
  }

  const dropdownContent = isOpen && createPortal(
    <div className="fixed z-[100]" style={{ top: `${buttonPosition.top}px`, left: `${buttonPosition.left}px` }}>
      {/* Arrow pointing to the button */}
      <div className="absolute left-6 sm:left-6 top-[-6px] w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-border" />
      <div className="mt-1 w-[80vw] sm:w-[600px] max-w-[600px] bg-background border rounded-lg shadow-lg animate-in fade-in-0 zoom-in-95 duration-200">
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
    </div>,
    document.body
  )

  return (
    <div ref={containerRef} className="relative">
      <Button
        ref={buttonRef}
        variant="ghost"
        size="sm"
        onClick={handleButtonClick}
        className="flex items-center gap-2 text-sm font-medium hover:bg-accent cursor-pointer"
      >
        {getButtonIcon()}
        <span className="hidden sm:inline">{getButtonText()}</span>
        <span className="sm:hidden">
          {currentTeam ? truncateText(currentTeam.name, 10) : 'Team'}
        </span>
        <ChevronDown className="h-4 w-4" />
      </Button>
      
      {dropdownContent}

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

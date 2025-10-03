import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { db } from '@/lib/appwrite/db'
import { getTeamsClient } from '@/lib/appwrite'
import { Query } from 'appwrite'
import type { Blogs } from '@/lib/appwrite/appwrite.types'

interface TeamBlogContextType {
  currentTeam: any | null
  currentBlog: Blogs | null
  setCurrentTeam: (team: any | null) => void
  setCurrentBlog: (blog: Blogs | null) => void
}

const TeamBlogContext = createContext<TeamBlogContextType | undefined>(undefined)

const STORAGE_KEYS = {
  CURRENT_TEAM: 'cortext_current_team',
  CURRENT_BLOG: 'cortext_current_blog'
}

export function TeamBlogProvider({ children, userId }: { children: ReactNode; userId: string }) {
  const [currentTeam, setCurrentTeamState] = useState<any | null>(null)
  const [currentBlog, setCurrentBlogState] = useState<Blogs | null>(null)
  const queryClient = useQueryClient()

  // Load teams for the user using Appwrite Teams API
  const { data: teams } = useQuery({
    queryKey: ['teams', userId],
    queryFn: async () => {
      const teamsClient = getTeamsClient()
      const res = await teamsClient.list()
      return res.teams
    },
    enabled: !!userId
  })

  // Load blogs for the current team
  const { data: blogs } = useQuery({
    queryKey: ['blogs', currentTeam?.$id],
    queryFn: async () => {
      if (!currentTeam?.$id) return []
      const res = await db.blogs.list([
        Query.equal('teamId', currentTeam.$id),
        Query.equal('status', 'active'),
        Query.orderDesc('$createdAt')
      ])
      return res.documents
    },
    enabled: !!currentTeam?.$id
  })

  // Load saved state from localStorage on mount
  useEffect(() => {
    const savedTeamId = localStorage.getItem(STORAGE_KEYS.CURRENT_TEAM)
    const savedBlogId = localStorage.getItem(STORAGE_KEYS.CURRENT_BLOG)

    if (savedTeamId && teams) {
      const team = teams.find(t => t.$id === savedTeamId)
      if (team) {
        setCurrentTeamState(team)
      }
    } else if (teams && teams.length > 0) {
      // Auto-select first team if none selected
      setCurrentTeamState(teams[0])
    }

    if (savedBlogId && blogs) {
      const blog = blogs.find(b => b.$id === savedBlogId)
      if (blog) {
        setCurrentBlogState(blog)
      }
    } else if (blogs && blogs.length > 0) {
      // Auto-select first blog if none selected
      setCurrentBlogState(blogs[0])
    }
  }, [teams, blogs])

  const setCurrentTeam = (team: any | null) => {
    setCurrentTeamState(team)
    if (team) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_TEAM, team.$id)
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_TEAM)
    }
    // Clear current blog when team changes
    setCurrentBlogState(null)
    localStorage.removeItem(STORAGE_KEYS.CURRENT_BLOG)
  }

  const setCurrentBlog = (blog: Blogs | null) => {
    setCurrentBlogState(blog)
    if (blog) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_BLOG, blog.$id)
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_BLOG)
    }
  }

  const value = {
    currentTeam,
    currentBlog,
    setCurrentTeam,
    setCurrentBlog
  }

  return (
    <TeamBlogContext.Provider value={value}>
      {children}
    </TeamBlogContext.Provider>
  )
}

export function useTeamBlogContext() {
  const context = useContext(TeamBlogContext)
  if (context === undefined) {
    throw new Error('useTeamBlogContext must be used within a TeamBlogProvider')
  }
  return context
}

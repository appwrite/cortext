import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { db } from '@/lib/appwrite/db'
import { getTeamsClient } from '@/lib/appwrite'
import { Query, ID } from 'appwrite'
import type { Blogs } from '@/lib/appwrite/appwrite.types'

interface TeamBlogContextType {
  // Current selection
  currentTeam: any | null
  currentBlog: Blogs | null
  
  // Data
  teams: any[] | undefined
  blogs: Blogs[] | undefined
  
  // Loading states
  isLoadingTeams: boolean
  isLoadingBlogs: boolean
  
  // Actions
  setCurrentTeam: (team: any | null) => void
  setCurrentBlog: (blog: Blogs | null) => void
  refreshTeams: () => Promise<void>
  refreshBlogs: () => Promise<void>
  createDefaultTeamAndBlog: () => Promise<{ team: any; blog: Blogs }>
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

  // Load teams for the user using Appwrite Teams API - single source of truth
  const { data: teams, isLoading: isLoadingTeams } = useQuery({
    queryKey: ['teams', userId],
    queryFn: async () => {
      const teamsClient = getTeamsClient()
      const res = await teamsClient.list()
      return res.teams
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  })

  // Load blogs for the current team - single source of truth
  const { data: blogs, isLoading: isLoadingBlogs } = useQuery({
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
    enabled: !!currentTeam?.$id,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  })

  // Create default team and blog if user has none
  const createDefaultTeamAndBlog = useCallback(async () => {
    try {
      const teamsClient = getTeamsClient()
      
      // Create a default team
      const defaultTeam = await teamsClient.create(ID.unique(), 'My Team')
      
      // Create a default blog
      const defaultBlog = await db.blogs.create({
        name: 'My Blog',
        slug: 'my-blog',
        description: 'Welcome to your new blog! Start writing amazing content.',
        domain: null,
        logo: null,
        favicon: null,
        theme: null,
        settings: null,
        ownerId: userId,
        teamId: defaultTeam.$id,
        status: 'active',
        seoTitle: null,
        seoDescription: null,
        seoKeywords: null
      }, defaultTeam.$id)

      // Set as current selections
      setCurrentTeamState(defaultTeam)
      setCurrentBlogState(defaultBlog)
      
      // Update localStorage
      localStorage.setItem(STORAGE_KEYS.CURRENT_TEAM, defaultTeam.$id)
      localStorage.setItem(STORAGE_KEYS.CURRENT_BLOG, defaultBlog.$id)
      
      // Refresh queries
      await queryClient.invalidateQueries({ queryKey: ['teams', userId] })
      await queryClient.invalidateQueries({ queryKey: ['blogs', defaultTeam.$id] })
      
      return { team: defaultTeam, blog: defaultBlog }
    } catch (error) {
      console.error('Failed to create default team and blog:', error)
      throw error
    }
  }, [userId, queryClient])

  // Load saved state from localStorage on mount and handle fallbacks
  useEffect(() => {
    const savedTeamId = localStorage.getItem(STORAGE_KEYS.CURRENT_TEAM)

    if (teams && teams.length > 0) {
      let selectedTeam: any | null = null
      
      // Try to find the saved team, or fall back to first team
      if (savedTeamId) {
        selectedTeam = teams.find(t => t.$id === savedTeamId) || null
      }
      
      // If saved team not found or no saved team, use first team
      if (!selectedTeam) {
        selectedTeam = teams[0]
        // Update localStorage with the fallback team
        localStorage.setItem(STORAGE_KEYS.CURRENT_TEAM, selectedTeam.$id)
      }
      
      setCurrentTeamState(selectedTeam)
    } else if (teams && teams.length === 0) {
      // No teams exist - automatically create default team and blog
      createDefaultTeamAndBlog().catch(error => {
        console.error('Failed to create default team and blog:', error)
      })
    }

    // Note: Blog selection will be handled in a separate useEffect that depends on blogs
  }, [teams, createDefaultTeamAndBlog])

  // Handle blog selection when blogs are loaded
  useEffect(() => {
    if (blogs && blogs.length > 0) {
      const savedBlogId = localStorage.getItem(STORAGE_KEYS.CURRENT_BLOG)
      let selectedBlog: Blogs | null = null
      
      // Try to find the saved blog, or fall back to first blog
      if (savedBlogId) {
        selectedBlog = blogs.find(b => b.$id === savedBlogId) || null
      }
      
      // If saved blog not found or no saved blog, use first blog
      if (!selectedBlog) {
        selectedBlog = blogs[0]
        // Update localStorage with the fallback blog
        localStorage.setItem(STORAGE_KEYS.CURRENT_BLOG, selectedBlog.$id)
      }
      
      setCurrentBlogState(selectedBlog)
    }
  }, [blogs])

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
    
    // Force refresh blogs for the new team
    if (team?.$id) {
      queryClient.invalidateQueries({ queryKey: ['blogs', team.$id] })
    }
  }

  const setCurrentBlog = (blog: Blogs | null) => {
    setCurrentBlogState(blog)
    if (blog) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_BLOG, blog.$id)
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_BLOG)
    }
  }

  // Refresh functions for manual updates
  const refreshTeams = async () => {
    await queryClient.invalidateQueries({ queryKey: ['teams', userId] })
  }

  const refreshBlogs = async () => {
    if (currentTeam?.$id) {
      await queryClient.invalidateQueries({ queryKey: ['blogs', currentTeam.$id] })
    }
  }


  const value = {
    // Current selection
    currentTeam,
    currentBlog,
    
    // Data
    teams,
    blogs,
    
    // Loading states
    isLoadingTeams,
    isLoadingBlogs,
    
    // Actions
    setCurrentTeam,
    setCurrentBlog,
    refreshTeams,
    refreshBlogs,
    createDefaultTeamAndBlog
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

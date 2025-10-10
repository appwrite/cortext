import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db, createUpdateRevision } from '@/lib/appwrite/db'
import { useArticle } from '@/contexts/article-context'
import type { Articles, Revisions } from '@/lib/appwrite/appwrite.types'

export function useRevisions(articleId: string) {
  const queryClient = useQueryClient()
  const { revisions, refreshRevisions } = useArticle()

  // Get a specific revision
  const getRevision = useQuery({
    queryKey: ['revision', articleId],
    queryFn: ({ queryKey }) => {
      const [, revisionId] = queryKey
      return db.revisions.get(revisionId as string)
    },
    enabled: false, // Only fetch when explicitly called
  })

  // Create a new revision for article updates
  const createRevisionMutation = useMutation({
    mutationFn: async ({ 
      oldArticle, 
      newArticle, 
      teamId, 
      messageId,
      userInfo
    }: { 
      oldArticle: Articles; 
      newArticle: Articles; 
      teamId?: string; 
      messageId?: string;
      userInfo?: { userId: string; userName: string; userEmail: string };
    }) => {
      return createUpdateRevision(articleId, oldArticle, newArticle, teamId, messageId, userInfo)
    },
    onSuccess: () => {
      refreshRevisions()
    },
  })

  // Update revision status
  const updateRevisionMutation = useMutation({
    mutationFn: async ({ 
      revisionId, 
      data 
    }: { 
      revisionId: string; 
      data: Partial<Omit<Revisions, keyof any>> 
    }) => {
      return db.revisions.update(revisionId, data)
    },
    onSuccess: () => {
      refreshRevisions()
    },
  })

  // Delete revision
  const deleteRevisionMutation = useMutation({
    mutationFn: async (revisionId: string) => {
      return db.revisions.delete(revisionId)
    },
    onSuccess: () => {
      refreshRevisions()
    },
  })

  return {
    revisions,
    isLoading: false, // Data comes from context now
    error: null,
    createRevision: createRevisionMutation.mutateAsync,
    updateRevision: updateRevisionMutation.mutateAsync,
    deleteRevision: deleteRevisionMutation.mutateAsync,
    isCreating: createRevisionMutation.isPending,
    isUpdating: updateRevisionMutation.isPending,
    isDeleting: deleteRevisionMutation.isPending,
  }
}

// Hook for getting revision history with change details
export function useRevisionHistory(articleId: string) {
  const { revisions, isLoading, error } = useRevisions(articleId)

  const revisionHistory = revisions.map(revision => {
    try {
      const data = JSON.parse(revision.data)
      return {
        ...revision,
        parsedData: data,
        isInitial: data.initial || false,
        isPublished: revision.status === 'publish',
        changedAttributes: data.changedAttributes || {},
        sectionChanges: data.changedAttributes?.sections || [],
        timestamp: data.timestamp || revision.$createdAt,
      }
    } catch (error) {
      console.error('Error parsing revision data:', error, revision)
      return {
        ...revision,
        parsedData: null,
        isInitial: false,
        isPublished: revision.status === 'publish',
        changedAttributes: {},
        sectionChanges: [],
        timestamp: revision.$createdAt,
      }
    }
  })

  return {
    revisionHistory,
    isLoading,
    error,
  }
}

// Hook for tracking changes and creating revisions
export function useChangeTracking(articleId: string, teamId?: string) {
  const { createRevision } = useRevisions(articleId)
  const queryClient = useQueryClient()

  const trackChanges = async (
    oldArticle: Articles, 
    newArticle: Articles, 
    messageId?: string,
    userInfo?: { userId: string; userName: string; userEmail: string }
  ) => {
    try {
      const revision = await createRevision({
        oldArticle,
        newArticle,
        teamId,
        messageId,
        userInfo
      })

      if (revision) {
        // Update the article's active revision ID
        await db.articles.update(articleId, { activeRevisionId: revision.$id })
        
        // Invalidate article queries to refresh the UI
        queryClient.invalidateQueries({ queryKey: ['articles'] })
        
        return revision
      }
      
      return null
    } catch (error) {
      console.error('Error tracking changes:', error)
      throw error
    }
  }

  return {
    trackChanges,
  }
}

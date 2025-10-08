import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db, createUpdateRevision } from '@/lib/appwrite/db'
import { Query } from 'appwrite'
import type { Articles, Revisions } from '@/lib/appwrite/appwrite.types'

export function useRevisions(articleId: string) {
  const queryClient = useQueryClient()

  // Get all revisions for an article
  const revisionsQuery = useQuery({
    queryKey: ['revisions', articleId],
    queryFn: () => 
      db.revisions.list([
        Query.equal('articleId', articleId),
        Query.orderDesc('version'),
        Query.limit(100)
      ]),
    enabled: !!articleId,
  })

  // Get a specific revision
  const getRevision = useQuery({
    queryKey: ['revision', articleId],
    queryFn: (revisionId: string) => db.revisions.get(revisionId),
    enabled: false, // Only fetch when explicitly called
  })

  // Create a new revision for article updates
  const createRevisionMutation = useMutation({
    mutationFn: async ({ 
      oldArticle, 
      newArticle, 
      teamId, 
      messageId 
    }: { 
      oldArticle: Articles; 
      newArticle: Articles; 
      teamId?: string; 
      messageId?: string 
    }) => {
      return createUpdateRevision(articleId, oldArticle, newArticle, teamId, messageId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revisions', articleId] })
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
      queryClient.invalidateQueries({ queryKey: ['revisions', articleId] })
    },
  })

  // Delete revision
  const deleteRevisionMutation = useMutation({
    mutationFn: async (revisionId: string) => {
      return db.revisions.delete(revisionId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revisions', articleId] })
    },
  })

  return {
    revisions: revisionsQuery.data?.documents || [],
    isLoading: revisionsQuery.isLoading,
    error: revisionsQuery.error,
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
        isPublished: revision.status === 'published',
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
        isPublished: revision.status === 'published',
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
    messageId?: string
  ) => {
    try {
      const revision = await createRevision({
        oldArticle,
        newArticle,
        teamId,
        messageId
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

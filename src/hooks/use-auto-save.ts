import { useEffect, useRef, useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { db, createUpdateRevision } from '@/lib/appwrite/db'
import type { Articles } from '@/lib/appwrite/appwrite.types'

interface AutoSaveOptions {
  articleId: string
  article: Articles | null | undefined
  teamId?: string
  userId: string
  debounceMs?: number
  interactionDelayMs?: number
}

interface AutoSaveState {
  isSaving: boolean
  lastSaved: Date | null
  hasUnsavedChanges: boolean
  saveError: string | null
  showSaved: boolean
  queueLength: number
}

interface SaveQueueItem {
  formData: any
  timestamp: number
  id: string
}

export function useAutoSave({
  articleId,
  article,
  teamId,
  userId,
  debounceMs = 1000,
  interactionDelayMs = 2000
}: AutoSaveOptions) {
  const [state, setState] = useState<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    hasUnsavedChanges: false,
    saveError: null,
    showSaved: false,
    queueLength: 0
  })

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedDataRef = useRef<string | null>(null)
  const queryClient = useQueryClient()
  
  // Queue management
  const saveQueueRef = useRef<SaveQueueItem[]>([])
  const isProcessingQueueRef = useRef(false)
  const queueIdCounterRef = useRef(0)
  
  // Interaction tracking
  const lastInteractionRef = useRef<number>(0)
  const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Track user interaction to delay auto-save
  const trackInteraction = useCallback(() => {
    lastInteractionRef.current = Date.now()
    
    // Clear existing interaction timeout
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current)
    }
    
    // Set a new timeout to reset interaction tracking
    interactionTimeoutRef.current = setTimeout(() => {
      lastInteractionRef.current = 0
    }, interactionDelayMs)
  }, [interactionDelayMs])
  
  // Check if user is still actively interacting
  const isUserInteracting = useCallback(() => {
    return lastInteractionRef.current > 0 && (Date.now() - lastInteractionRef.current) < interactionDelayMs
  }, [interactionDelayMs])

  // Mutation for updating article
  const updateArticle = useMutation({
    mutationFn: (data: Partial<Articles>) => db.articles.update(articleId, data),
    onSuccess: () => {
      // Don't invalidate article query to prevent race conditions
      // The form state is already up-to-date
    }
  })

  const performSave = useCallback(async (formData: any) => {
    if (!article) return

    // Additional safety check - ensure article has required fields
    if (!article.$id || !article.title) {
      console.warn('Auto-save skipped: Invalid article data')
      return
    }

    // Check if this save is still relevant by comparing with the last saved data
    // This prevents processing stale data when sections are deleted quickly
    const formDataString = JSON.stringify({
      trailer: formData.trailer,
      title: formData.title,
      slug: formData.slug,
      subtitle: formData.subtitle,
      live: formData.live,
      redirect: formData.redirect,
      authors: formData.authors,
      categories: formData.categories,
      body: formData.body,
      status: formData.status,
    })
    
    // If this data is the same as what we last saved, skip this save
    if (lastSavedDataRef.current === formDataString) {
      console.warn('Auto-save skipped: Data is identical to last saved data')
      return
    }

    try {
      setState(prev => ({ ...prev, saveError: null }))

      // Add a timeout to prevent auto-save from hanging indefinitely
      const saveTimeout = setTimeout(() => {
        console.warn('Auto-save timeout - resetting state')
        setState(prev => ({ ...prev, isSaving: false, saveError: 'Save timeout' }))
        throw new Error('Save timeout')
      }, 10000) // 10 second timeout

      const currentFormData = {
        trailer: formData.trailer,
        title: formData.title,
        slug: formData.slug,
        subtitle: formData.subtitle,
        live: formData.live,
        redirect: formData.redirect,
        authors: formData.authors,
        categories: formData.categories,
        body: formData.body,
        status: formData.status,
        pinned: article.pinned || false,
        images: article.images || null,
        blogId: article.blogId || null,
        createdBy: article.createdBy || userId,
      }

      // Always create a revision first
      const revision = await createUpdateRevision(
        articleId,
        article,
        currentFormData as Articles,
        teamId
      )

      if (revision) {
        // If article hasn't been published, also update the article directly
        if (article.status !== 'published') {
          const updatedArticleData = {
            ...currentFormData,
            activeRevisionId: revision.$id,
          }
          await updateArticle.mutateAsync(updatedArticleData)
          
          // Don't update the article cache directly to prevent race conditions with local state
          // The form state is already up-to-date and should be the source of truth
          // Cache updates can cause deleted sections to reappear briefly
        }

        // Update the revisions cache directly instead of invalidating to prevent race conditions
        queryClient.setQueryData(['revisions', articleId], (oldData: any) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            documents: [revision, ...(oldData.documents || [])]
          }
        })

        setState(prev => ({
          ...prev,
          lastSaved: new Date(),
          hasUnsavedChanges: false,
          saveError: null,
          showSaved: true
        }))
        
        clearTimeout(saveTimeout)

        // Hide the saved indicator after 3 seconds
        if (savedTimeoutRef.current) {
          clearTimeout(savedTimeoutRef.current)
        }
        savedTimeoutRef.current = setTimeout(() => {
          setState(prev => ({ ...prev, showSaved: false }))
        }, 3000)

        // Update the reference to track what was last saved
        lastSavedDataRef.current = JSON.stringify(formData)
      }
    } catch (error) {
      console.error('Auto-save error:', error)
      clearTimeout(saveTimeout)
      setState(prev => ({
        ...prev,
        saveError: error instanceof Error ? error.message : 'Unknown error'
      }))
      
      // Re-throw error so queue processing can handle it
      throw error
    }
  }, [article, articleId, teamId, userId, updateArticle.mutateAsync])

  // Process the save queue sequentially
  const processQueue = useCallback(async () => {
    if (isProcessingQueueRef.current || saveQueueRef.current.length === 0) {
      return
    }

    isProcessingQueueRef.current = true
    setState(prev => ({ ...prev, isSaving: true, queueLength: saveQueueRef.current.length }))

    while (saveQueueRef.current.length > 0) {
      const queueItem = saveQueueRef.current.shift()!
      setState(prev => ({ ...prev, queueLength: saveQueueRef.current.length }))

      try {
        await performSave(queueItem.formData)
      } catch (error) {
        console.error('Error processing save queue item:', error)
        // Continue processing other items even if one fails
      }
    }

    isProcessingQueueRef.current = false
    setState(prev => ({ ...prev, isSaving: false, queueLength: 0 }))
  }, [performSave])

  // Add item to save queue
  const addToQueue = useCallback((formData: any) => {
    const queueId = ++queueIdCounterRef.current
    const queueItem: SaveQueueItem = {
      formData,
      timestamp: Date.now(),
      id: `save-${queueId}`
    }

    // Clear the entire queue when new data comes in to prevent stale data processing
    // This is especially important when sections are deleted quickly
    saveQueueRef.current = []

    // Add new item to queue
    saveQueueRef.current.push(queueItem)
    setState(prev => ({ ...prev, queueLength: saveQueueRef.current.length }))

    // Start processing if not already processing
    if (!isProcessingQueueRef.current) {
      processQueue()
    }
  }, [processQueue])

  const triggerAutoSave = useCallback((formData: any) => {
    // Track this as a user interaction
    trackInteraction()
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Use a more efficient comparison by checking specific fields instead of full JSON.stringify
    const currentDataString = JSON.stringify({
      trailer: formData.trailer,
      title: formData.title,
      subtitle: formData.subtitle,
      live: formData.live,
      redirect: formData.redirect,
      authors: formData.authors,
      categories: formData.categories,
      status: formData.status,
      body: formData.body
    })
    
    if (lastSavedDataRef.current && currentDataString === lastSavedDataRef.current) {
      setState(prev => ({ ...prev, hasUnsavedChanges: false }))
      return
    }

    // If this is the first save (lastSavedDataRef.current is null), don't set hasUnsavedChanges yet
    if (lastSavedDataRef.current) {
      setState(prev => ({ ...prev, hasUnsavedChanges: true }))
    }

    // Calculate delay based on user interaction
    const baseDelay = debounceMs
    const interactionDelay = isUserInteracting() ? interactionDelayMs : 0
    const totalDelay = baseDelay + interactionDelay

    // Set new timeout to add to queue after calculated delay
    timeoutRef.current = setTimeout(() => {
      // Double-check that user is not still interacting before saving
      if (!isUserInteracting()) {
        addToQueue(formData)
      } else {
        // If user is still interacting, reschedule the save
        triggerAutoSave(formData)
      }
    }, totalDelay)
  }, [addToQueue, debounceMs, trackInteraction, isUserInteracting, interactionDelayMs])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current)
      }
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current)
      }
    }
  }, [])

  return {
    ...state,
    triggerAutoSave,
    trackInteraction,
    isAutoSaving: state.isSaving,
    queueLength: state.queueLength
  }
}

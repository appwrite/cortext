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
}

interface AutoSaveState {
  isSaving: boolean
  lastSaved: Date | null
  hasUnsavedChanges: boolean
  saveError: string | null
  showSaved: boolean
}

export function useAutoSave({
  articleId,
  article,
  teamId,
  userId,
  debounceMs = 1000
}: AutoSaveOptions) {
  const [state, setState] = useState<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    hasUnsavedChanges: false,
    saveError: null,
    showSaved: false
  })

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedDataRef = useRef<string | null>(null)
  const isSavingRef = useRef(false)
  const queryClient = useQueryClient()

  // Mutation for updating article
  const updateArticle = useMutation({
    mutationFn: (data: Partial<Articles>) => db.articles.update(articleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article', articleId] })
    }
  })

  const performSave = useCallback(async (formData: any) => {
    if (!article || isSavingRef.current) return

    try {
      isSavingRef.current = true
      setState(prev => ({ ...prev, isSaving: true, saveError: null }))

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
          await updateArticle.mutateAsync({
            ...currentFormData,
            activeRevisionId: revision.$id,
          })
        }

        // Always invalidate revisions query after creating a revision
        // This will also update the latest revision since useLatestRevision now uses the same query
        queryClient.invalidateQueries({ queryKey: ['revisions', articleId] })

        setState(prev => ({
          ...prev,
          isSaving: false,
          lastSaved: new Date(),
          hasUnsavedChanges: false,
          saveError: null,
          showSaved: true
        }))
        
        isSavingRef.current = false

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
      setState(prev => ({
        ...prev,
        isSaving: false,
        saveError: error instanceof Error ? error.message : 'Unknown error'
      }))
      isSavingRef.current = false
    }
  }, [article, articleId, teamId, userId, updateArticle.mutateAsync])

  const triggerAutoSave = useCallback((formData: any) => {
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

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      performSave(formData)
    }, debounceMs)
  }, [performSave, debounceMs])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current)
      }
    }
  }, [])

  return {
    ...state,
    triggerAutoSave,
    isAutoSaving: state.isSaving
  }
}

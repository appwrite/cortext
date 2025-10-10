/**
 * Auto-save hook
 * Handles automatic saving of user changes
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { detectChangeSource, detectArticleChanges, shouldAutoSave } from '../lib/change-detection'
import { db } from '../lib/appwrite/db'
import { createUpdateRevision } from '../lib/appwrite/db'
import type { Articles } from '../lib/appwrite/appwrite.types'

export interface AutoSaveConfig {
  saveInterval?: number // Auto-save interval in milliseconds (default: 5000)
  debounceDelay?: number // Debounce delay for rapid changes (default: 1000)
  maxRetries?: number // Maximum retry attempts for failed saves (default: 3)
  retryDelay?: number // Delay between retries in milliseconds (default: 2000)
}

export interface AutoSaveState {
  status: 'idle' | 'saving' | 'saved' | 'error'
  lastSaved?: Date
  hasUnsavedChanges: boolean
  error?: string
}

const DEFAULT_CONFIG: Required<AutoSaveConfig> = {
  saveInterval: 5000, // 5 seconds
  debounceDelay: 1000, // 1 second
  maxRetries: 3,
  retryDelay: 2000,
}

export function useAutoSave(
  articleId: string,
  userId: string,
  teamId?: string,
  config: AutoSaveConfig = {},
  userInfo?: { userName: string; userEmail: string }
) {
  const queryClient = useQueryClient()
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  const [state, setState] = useState<AutoSaveState>({
    status: 'idle',
    hasUnsavedChanges: false,
  })

  // Debug status changes
  useEffect(() => {
    }, [state.status, state.hasUnsavedChanges, state.lastSaved, state.error])

  // Auto-reset stuck "saving" status
  useEffect(() => {
    if (state.status === 'saving') {
      const timeout = setTimeout(() => {
        setState(prev => ({
          ...prev,
          status: 'idle',
          error: 'Save timeout - please try again'
        }))
      }, 30000) // 30 second timeout

      return () => clearTimeout(timeout)
    }
  }, [state.status])

  // Refs for managing timers and state
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)
  const lastSavedDataRef = useRef<any>(null)
  const isSavingRef = useRef(false)

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // Initialize lastSavedDataRef with first data that comes in
  const initializeLastSavedData = useCallback((data: any) => {
    if (!lastSavedDataRef.current && data) {
      lastSavedDataRef.current = data
    }
  }, [])

  // Debug auto-save hook state
  useEffect(() => {
    }, [articleId, state.status, state.hasUnsavedChanges])

  /**
   * Save changes to the server
   */
  const saveToServer = useCallback(async (data: any, isHumanChange: boolean = true) => {
    if (isSavingRef.current) {
      return false
    }

    try {
      isSavingRef.current = true
      setState(prev => ({ ...prev, status: 'saving' }))
      // Create revision if there are changes
      const revision = await createUpdateRevision(
        articleId,
        lastSavedDataRef.current || data, // Use last saved data as baseline, fallback to current data
        data,
        teamId,
        undefined, // messageId
        isHumanChange ? { 
          userId, 
          userName: userInfo?.userName || '', 
          userEmail: userInfo?.userEmail || '' 
        } : undefined
      )

      if (revision) {
        // Update the article
        await db.articles.update(articleId, {
          ...data,
          activeRevisionId: revision.$id
        })
        // Update cache
        queryClient.setQueryData(['article', articleId], (oldData: any) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            ...data,
            activeRevisionId: revision.$id,
            $updatedAt: new Date().toISOString()
          }
        })

        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['articles'] })
        queryClient.invalidateQueries({ queryKey: ['latest-revision', articleId] })
        queryClient.invalidateQueries({ queryKey: ['revisions', articleId] })
        setState(prev => ({
          ...prev,
          status: 'saved',
          lastSaved: new Date(),
          hasUnsavedChanges: false,
          error: undefined
        }))

        lastSavedDataRef.current = data
        retryCountRef.current = 0
        return true
      }

      return false
    } catch (error) {
      console.error('❌ Auto-save failed:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setState(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage
      }))

      // Retry logic
      if (retryCountRef.current < finalConfig.maxRetries) {
        retryCountRef.current++
        setTimeout(async () => {
          await saveToServer(data, isHumanChange)
        }, finalConfig.retryDelay)
      }

      return false
    } finally {
      isSavingRef.current = false
      // Reset status to idle if it's still saving (in case of errors)
      setState(prev => ({
        ...prev,
        status: prev.status === 'saving' ? 'idle' : prev.status
      }))
      }
  }, [articleId, userId, teamId, queryClient, finalConfig.maxRetries, finalConfig.retryDelay])


  /**
   * Process changes and decide whether to save
   */
  const processChanges = useCallback((
    newData: any,
    context?: {
      messageId?: string
      revisionId?: string
      isRevert?: boolean
      isInitialLoad?: boolean
    }
  ) => {
    // Initialize lastSavedDataRef if not already done
    initializeLastSavedData(newData)

    // Detect change source
    const changeSource = detectChangeSource(newData, {
      userId,
      messageId: context?.messageId,
      revisionId: context?.revisionId,
      isRevert: context?.isRevert,
      isInitialLoad: context?.isInitialLoad
    })

    // Detect what changed
    const { hasChanges, changes, changedFields } = detectArticleChanges(
      lastSavedDataRef.current,
      newData
    )

    if (!hasChanges) {
      return // No changes to save
    }

    // Check if we should auto-save
    const shouldSave = shouldAutoSave(changes, changedFields, changeSource.isHumanChange)

    if (!shouldSave) {
      return // Don't save this type of change
    }

    // Mark as having unsaved changes
    setState(prev => ({
      ...prev,
      hasUnsavedChanges: true
    }))

    // Clear existing timers
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    // Set up debounced save to server
    debounceTimerRef.current = setTimeout(() => {
      if (!isSavingRef.current) {
        saveTimerRef.current = setTimeout(async () => {
          await saveToServer(newData, changeSource.isHumanChange)
        }, finalConfig.saveInterval)
      } else {
        }
    }, finalConfig.debounceDelay)
  }, [userId, finalConfig.debounceDelay, finalConfig.saveInterval])


  /**
   * Force save current data
   */
  const forceSave = useCallback(async (data: any, isHumanChange: boolean = true) => {
    // Clear any pending timers
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    // Save to server
    return await saveToServer(data, isHumanChange)
  }, [saveToServer])

  /**
   * Clear all unsaved changes
   */
  const clearUnsavedChanges = useCallback(() => {
    setState(prev => ({
      ...prev,
      hasUnsavedChanges: false,
      status: 'idle'
    }))
  }, [])

  /**
   * Get unsaved changes count
   */
  const getUnsavedChangesCount = useCallback(() => {
    return state.hasUnsavedChanges ? 1 : 0
  }, [state.hasUnsavedChanges])

  /**
   * Check if there are unsaved changes
   */
  const hasUnsavedChanges = useCallback(() => {
    return state.hasUnsavedChanges
  }, [state.hasUnsavedChanges])

  return {
    // State
    ...state,
    
    // Actions
    processChanges,
    forceSave,
    clearUnsavedChanges,
    
    // Utilities
    getUnsavedChangesCount,
    hasUnsavedChanges: hasUnsavedChanges(),
    
    // Config
    config: finalConfig
  }
}

/**
 * Auto-save hook with offline-first support
 * Handles automatic saving of user changes with local storage backup
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { offlineStorage, OfflineChange } from '../lib/offline-storage'
import { detectChangeSource, detectArticleChanges, shouldAutoSave, isLocalStorageAvailable } from '../lib/change-detection'
import { db } from '../lib/appwrite/db'
import { createUpdateRevision } from '../lib/appwrite/db'

export interface AutoSaveConfig {
  saveInterval?: number // Auto-save interval in milliseconds (default: 5000)
  debounceDelay?: number // Debounce delay for rapid changes (default: 1000)
  maxRetries?: number // Maximum retry attempts for failed saves (default: 3)
  retryDelay?: number // Delay between retries in milliseconds (default: 2000)
}

export interface AutoSaveState {
  status: 'idle' | 'saving' | 'saved' | 'error' | 'offline'
  lastSaved?: Date
  hasUnsavedChanges: boolean
  error?: string
  isOnline: boolean
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
    isOnline: navigator.onLine,
  })

  // Debug status changes
  useEffect(() => {
    console.log('🔄 Auto-save status changed:', state.status, {
      hasUnsavedChanges: state.hasUnsavedChanges,
      isOnline: state.isOnline,
      lastSaved: state.lastSaved,
      error: state.error
    })
  }, [state.status, state.hasUnsavedChanges, state.isOnline, state.lastSaved, state.error])

  // Auto-reset stuck "saving" status
  useEffect(() => {
    if (state.status === 'saving') {
      const timeout = setTimeout(() => {
        console.log('⚠️ Auto-save status stuck on "saving", resetting to idle')
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

  // Check if localStorage is available
  const storageAvailable = isLocalStorageAvailable()

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true, status: 'idle' }))
      // Try to save any pending changes when coming back online
      if (offlineStorage.hasUnsavedHumanChanges(articleId)) {
        triggerSave()
      }
    }

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false, status: 'offline' }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [articleId])

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

  /**
   * Save changes to the server
   */
  const saveToServer = useCallback(async (data: any, isHumanChange: boolean = true) => {
    console.log('🔄 saveToServer called:', {
      articleId,
      isHumanChange,
      isSaving: isSavingRef.current,
      hasData: !!data
    })

    if (isSavingRef.current) {
      console.log('⏭️ Already saving, skipping')
      return false
    }

    try {
      isSavingRef.current = true
      setState(prev => ({ ...prev, status: 'saving' }))
      console.log('💾 Starting server save...')

      // Get current article for comparison
      const currentArticle = await db.articles.get(articleId)
      console.log('📄 Current article fetched:', currentArticle.$id)
      
      // Create revision if there are changes
      const revision = await createUpdateRevision(
        articleId,
        currentArticle,
        data,
        teamId,
        undefined, // messageId
        isHumanChange ? { 
          userId, 
          userName: userInfo?.userName || '', 
          userEmail: userInfo?.userEmail || '' 
        } : undefined
      )

      console.log('📝 Revision creation result:', revision ? 'success' : 'no changes')

      if (revision) {
        // Update the article
        await db.articles.update(articleId, {
          ...data,
          activeRevisionId: revision.$id
        })
        console.log('✅ Article updated with revision:', revision.$id)

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
        console.log('🔄 Cache invalidated')

        setState(prev => ({
          ...prev,
          status: 'saved',
          lastSaved: new Date(),
          hasUnsavedChanges: false,
          error: undefined
        }))

        lastSavedDataRef.current = data
        retryCountRef.current = 0
        console.log('✅ Server save completed successfully')
        return true
      }

      console.log('⏭️ No revision created, no changes to save')
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
        console.log(`🔄 Retrying save (attempt ${retryCountRef.current}/${finalConfig.maxRetries})`)
        setTimeout(() => {
          triggerSave()
        }, finalConfig.retryDelay)
      } else {
        console.log('❌ Max retries reached, giving up')
      }

      return false
    } finally {
      isSavingRef.current = false
      // Reset status to idle if it's still saving (in case of errors)
      setState(prev => ({
        ...prev,
        status: prev.status === 'saving' ? 'idle' : prev.status
      }))
      console.log('🏁 Server save process finished')
    }
  }, [articleId, userId, teamId, queryClient, finalConfig.maxRetries, finalConfig.retryDelay])

  /**
   * Save changes offline
   */
  const saveOffline = useCallback((data: any, isHumanChange: boolean = true) => {
    console.log('💾 saveOffline called:', {
      articleId,
      isHumanChange,
      storageAvailable,
      hasData: !!data
    })

    if (!storageAvailable) {
      console.log('❌ Storage not available, cannot save offline')
      return false
    }

    try {
      const changeId = offlineStorage.storeChange({
        articleId,
        data,
        isHumanChange,
        version: 1
      })

      console.log('✅ Offline save successful:', changeId)

      setState(prev => ({
        ...prev,
        hasUnsavedChanges: true,
        status: prev.isOnline ? 'idle' : 'offline'
      }))

      return changeId
    } catch (error) {
      console.error('❌ Failed to save offline:', error)
      return false
    }
  }, [articleId, storageAvailable])

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
    console.log('🔄 Auto-save processChanges called:', {
      articleId,
      hasNewData: !!newData,
      context,
      isOnline: state.isOnline,
      isFullyLoaded: true, // This should be passed from the component
      currentStatus: state.status
    })

    // Detect change source
    const changeSource = detectChangeSource(newData, {
      userId,
      messageId: context?.messageId,
      revisionId: context?.revisionId,
      isRevert: context?.isRevert,
      isInitialLoad: context?.isInitialLoad
    })

    console.log('🔍 Change source detected:', changeSource)

    // Detect what changed
    const { hasChanges, changes, changedFields } = detectArticleChanges(
      lastSavedDataRef.current,
      newData
    )

    console.log('📊 Change detection:', {
      hasChanges,
      changes,
      changedFields,
      lastSavedData: lastSavedDataRef.current ? 'exists' : 'null'
    })

    if (!hasChanges) {
      console.log('⏭️ No changes detected, skipping auto-save')
      return // No changes to save
    }

    // Check if we should auto-save
    const shouldSave = shouldAutoSave(changes, changedFields, changeSource.isHumanChange)

    console.log('🤔 Should auto-save?', {
      shouldSave,
      isHumanChange: changeSource.isHumanChange,
      changesCount: changes.length,
      changedFieldsCount: changedFields.length
    })

    if (!shouldSave) {
      console.log('⏭️ Auto-save skipped - not a saveable change type')
      return // Don't save this type of change
    }

    // Always save human changes offline immediately
    if (changeSource.isHumanChange) {
      console.log('💾 Saving human change offline...')
      const changeId = saveOffline(newData, true)
      console.log('✅ Offline save result:', changeId ? 'success' : 'failed')
    }

    // Clear existing timers
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      console.log('🧹 Cleared existing debounce timer')
    }
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      console.log('🧹 Cleared existing save timer')
    }

    // Set up debounced save to server
    console.log('⏰ Setting up debounced save:', {
      debounceDelay: finalConfig.debounceDelay,
      saveInterval: finalConfig.saveInterval,
      isOnline: state.isOnline,
      isSaving: isSavingRef.current
    })

    debounceTimerRef.current = setTimeout(() => {
      console.log('⏰ Debounce timer fired, checking conditions...')
      if (state.isOnline && !isSavingRef.current) {
        console.log('✅ Conditions met, setting up server save timer')
        saveTimerRef.current = setTimeout(() => {
          console.log('🚀 Server save timer fired, triggering save')
          triggerSave()
        }, finalConfig.saveInterval)
      } else {
        console.log('❌ Conditions not met for server save:', {
          isOnline: state.isOnline,
          isSaving: isSavingRef.current
        })
      }
    }, finalConfig.debounceDelay)
  }, [userId, state.isOnline, saveOffline, finalConfig.debounceDelay, finalConfig.saveInterval])

  /**
   * Trigger immediate save
   */
  const triggerSave = useCallback(async () => {
    if (!state.isOnline || isSavingRef.current) return

    const latestChange = offlineStorage.getLatestHumanChange(articleId)
    if (!latestChange) return

    const success = await saveToServer(latestChange.data, true)
    
    if (success) {
      // Remove the saved change from offline storage
      offlineStorage.removeChange(articleId, latestChange.id)
    }
  }, [articleId, state.isOnline, saveToServer])

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

    // Save offline first
    if (isHumanChange) {
      saveOffline(data, true)
    }

    // Save to server if online
    if (state.isOnline) {
      return await saveToServer(data, isHumanChange)
    }

    return false
  }, [state.isOnline, saveOffline, saveToServer])

  /**
   * Clear all unsaved changes
   */
  const clearUnsavedChanges = useCallback(() => {
    offlineStorage.clearChanges(articleId)
    setState(prev => ({
      ...prev,
      hasUnsavedChanges: false,
      status: 'idle'
    }))
  }, [articleId])

  /**
   * Get unsaved changes count
   */
  const getUnsavedChangesCount = useCallback(() => {
    return offlineStorage.getChanges(articleId).length
  }, [articleId])

  /**
   * Check if there are unsaved changes
   */
  const hasUnsavedChanges = useCallback(() => {
    return offlineStorage.hasUnsavedHumanChanges(articleId)
  }, [articleId])

  // Initialize state from offline storage and restore changes
  useEffect(() => {
    if (storageAvailable) {
      const hasChanges = offlineStorage.hasUnsavedHumanChanges(articleId)
      setState(prev => ({
        ...prev,
        hasUnsavedChanges: hasChanges,
        status: hasChanges ? (prev.isOnline ? 'idle' : 'offline') : 'idle'
      }))

      // If there are offline changes and we're online, try to save them
      if (hasChanges && state.isOnline) {
        console.log('🔄 Found offline changes, attempting to restore and save...')
        // Small delay to ensure component is fully loaded
        setTimeout(() => {
          triggerSave()
        }, 1000)
      }
    }
  }, [articleId, storageAvailable, state.isOnline, triggerSave])

  return {
    // State
    ...state,
    
    // Actions
    processChanges,
    triggerSave,
    forceSave,
    clearUnsavedChanges,
    
    // Utilities
    getUnsavedChangesCount,
    hasUnsavedChanges: hasUnsavedChanges(),
    
    // Config
    config: finalConfig
  }
}

import { useEffect, useRef, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { client } from '@/lib/appwrite/db'

export interface RealtimeSubscription {
  channel: string
  queryKey: string[]
  filter?: (payload: any) => boolean
  onEvent?: (payload: any, event: string[]) => void
}

/**
 * Custom hook for managing Appwrite realtime subscriptions
 * @param subscriptions Array of subscription configurations
 * @param enabled Whether the subscriptions should be active
 */
export function useRealtime(subscriptions: RealtimeSubscription[], enabled: boolean = true) {
  const queryClient = useQueryClient()
  const subscriptionRefs = useRef(new Map<string, () => void>())

  useEffect(() => {
    if (!enabled) {
      return
    }

    // Subscribe to all channels
    subscriptions.forEach(({ channel, queryKey, filter, onEvent }) => {
      const subscriptionKey = `${channel}-${queryKey.join('-')}`
      
      // Clean up existing subscription if it exists
      if (subscriptionRefs.current.has(subscriptionKey)) {
        const unsubscribe = subscriptionRefs.current.get(subscriptionKey)
        unsubscribe?.()
        subscriptionRefs.current.delete(subscriptionKey)
      }

      // Create new subscription
      try {
        const unsubscribe = client.subscribe(channel, (response) => {
          const { payload, events } = response

          // Apply filter if provided
          if (filter && !filter(payload)) {
            return
          }

          // Invalidate and refetch queries
          queryClient.invalidateQueries({ queryKey }).then(() => {
            // Force refetch to ensure data is updated
            return queryClient.refetchQueries({ queryKey })
          }).catch((error) => {
            // Query invalidation/refetch failed
          })

          // Call custom event handler if provided
          if (onEvent) {
            onEvent(payload, events)
          }
        })

        // Store subscription for cleanup
        subscriptionRefs.current.set(subscriptionKey, unsubscribe)
      } catch (error) {
        // Failed to create subscription
      }
    })

    // Cleanup function
    return () => {
      subscriptionRefs.current.forEach((unsubscribe) => {
        unsubscribe()
      })
      subscriptionRefs.current.clear()
    }
  }, [subscriptions, enabled, queryClient])

  // Return cleanup function for manual control
  return {
    cleanup: () => {
      subscriptionRefs.current.forEach((unsubscribe) => {
        unsubscribe()
      })
      subscriptionRefs.current.clear()
    }
  }
}

/**
 * Hook for subscribing to a specific collection with filtering
 * Supports both collections/documents and tables/rows
 * @param collection Collection name
 * @param queryKey React Query key to invalidate
 * @param filter Optional filter function
 * @param enabled Whether subscription is active
 */
export function useCollectionRealtime(
  collection: string,
  queryKey: string[],
  filter?: (payload: any) => boolean,
  enabled: boolean = true
) {
  const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID
  const collectionChannel = `databases.${databaseId}.collections.${collection}.documents`
  const tableChannel = `databases.${databaseId}.tables.${collection}.rows`

  // Create subscriptions for both collections and tables
  const subscriptions = useMemo(() => [
    { 
      channel: collectionChannel, 
      queryKey, 
      filter 
    },
    { 
      channel: tableChannel, 
      queryKey, 
      filter 
    }
  ], [collectionChannel, tableChannel, queryKey, filter])

  return useRealtime(subscriptions, enabled)
}

/**
 * Hook for subscribing to messages with blog and article filtering
 * Supports both collections/documents and tables/rows
 * @param blogId Blog ID to filter by
 * @param articleId Article ID to filter by (used for additional context)
 * @param conversationId Conversation ID to filter by
 * @param enabled Whether subscription is active
 */
export function useMessagesRealtime(
  blogId?: string,
  articleId?: string,
  conversationId?: string,
  enabled: boolean = true
) {
  const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID
  const messagesCollectionChannel = `databases.${databaseId}.collections.messages.documents`
  const messagesTableChannel = `databases.${databaseId}.tables.messages.rows`
  const queryClient = useQueryClient()
  

  const filter = useMemo(() => (payload: any) => {
    if (!payload || typeof payload !== 'object') return false
    
    // Filter by blogId if provided
    if (blogId && payload.blogId !== blogId) {
      return false
    }
    
    // Filter by conversationId if provided (this is the primary filter)
    if (conversationId && payload.conversationId !== conversationId) {
      return false
    }
    
    // Additional validation: ensure we have the required fields
    if (!payload.conversationId || !payload.content || !payload.role) {
      return false
    }
    
    // Note: articleId is passed for context but messages are filtered by conversationId
    // The conversationId already ensures we only get messages for the correct article
    // since conversations are article-specific. This provides an additional layer of
    // security to ensure messages only appear in the correct UI context.
    
    return true
  }, [blogId, conversationId])

  const queryKey = useMemo(() => ['messages', conversationId || ''], [conversationId])

  // Custom event handler - optimistic updates without API calls
  const onEvent = useMemo(() => (payload: any, events: string[]) => {
    // Update the existing data optimistically without making API calls
    queryClient.setQueryData(queryKey, (oldData: any) => {
      if (!oldData?.documents) {
        return oldData
      }

      const messageId = payload.$id
      const isCreateEvent = events.some(event => event.includes('.create'))
      const isUpdateEvent = events.some(event => event.includes('.update'))

      if (isCreateEvent) {
        // Add new message to the beginning of the list
        return {
          ...oldData,
          documents: [payload, ...oldData.documents],
          total: oldData.total + 1
        }
      } else if (isUpdateEvent) {
        // Update existing message
        const messageIndex = oldData.documents.findIndex((msg: any) => msg.$id === messageId)
        if (messageIndex !== -1) {
          const updatedDocuments = [...oldData.documents]
          updatedDocuments[messageIndex] = payload
          return {
            ...oldData,
            documents: updatedDocuments
          }
        }
      }

      return oldData
    })

  }, [conversationId, queryClient, queryKey])

  // Create subscription for messages collection only to avoid duplicate events
  const subscriptions = useMemo(() => [
    { 
      channel: messagesCollectionChannel, 
      queryKey, 
      filter,
      onEvent
    }
  ], [messagesCollectionChannel, queryKey, filter, onEvent])

  return useRealtime(subscriptions, enabled)
}

/**
 * Hook for subscribing to notifications with toast support
 * Supports both collections/documents and tables/rows
 * @param userId User ID to filter by
 * @param enabled Whether subscription is active
 */
export function useNotificationsRealtime(userId: string, enabled: boolean = true) {
  const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID
  const notificationsCollectionChannel = `databases.${databaseId}.collections.notifications.documents`
  const notificationsTableChannel = `databases.${databaseId}.tables.notifications.rows`

  const filter = useMemo(() => (payload: any) => {
    return payload && typeof payload === 'object' && 'userId' in payload && payload.userId === userId
  }, [userId])

  const onEvent = useMemo(() => (payload: any, events: string[]) => {
    // Show toast for new notifications (only for create events)
    if (events.some(event => event.includes('.create'))) {
      // Import toast dynamically to avoid circular dependencies
      import('@/hooks/use-toast').then(({ toast }) => {
        toast({
          title: 'New notification',
          description: payload.title || 'You have a new notification',
          duration: 3000,
        })
      })
    }
  }, [])

  const queryKey = useMemo(() => ['notifications', userId], [userId])

  // Create subscriptions for both collections and tables
  const subscriptions = useMemo(() => [
    { 
      channel: notificationsCollectionChannel, 
      queryKey, 
      filter, 
      onEvent 
    },
    { 
      channel: notificationsTableChannel, 
      queryKey, 
      filter, 
      onEvent 
    }
  ], [notificationsCollectionChannel, notificationsTableChannel, queryKey, filter, onEvent])

  return useRealtime(subscriptions, enabled)
}

/**
 * Consolidated hook for managing multiple realtime subscriptions efficiently
 * This reduces the number of realtime connections by combining related subscriptions
 * @param subscriptions Array of subscription configurations
 * @param enabled Whether subscriptions should be active
 */
export function useConsolidatedRealtime(subscriptions: RealtimeSubscription[], enabled: boolean = true) {
  const queryClient = useQueryClient()
  const subscriptionRefs = useRef(new Map<string, () => void>())

  useEffect(() => {
    if (!enabled) {
      return
    }

    // Group subscriptions by channel to minimize connections
    const channelGroups = new Map<string, RealtimeSubscription[]>()
    subscriptions.forEach(sub => {
      if (!channelGroups.has(sub.channel)) {
        channelGroups.set(sub.channel, [])
      }
      channelGroups.get(sub.channel)!.push(sub)
    })

    // Subscribe to each unique channel
    channelGroups.forEach((channelSubscriptions, channel) => {
      const subscriptionKey = `consolidated-${channel}`
      
      // Clean up existing subscription if it exists
      if (subscriptionRefs.current.has(subscriptionKey)) {
        const unsubscribe = subscriptionRefs.current.get(subscriptionKey)
        unsubscribe?.()
        subscriptionRefs.current.delete(subscriptionKey)
      }

      // Create new consolidated subscription
      try {
        const unsubscribe = client.subscribe(channel, (response) => {
          const { payload, events } = response

          // Process each subscription for this channel
          channelSubscriptions.forEach(({ queryKey, filter, onEvent }) => {
            // Apply filter if provided
            if (filter && !filter(payload)) {
              return
            }

            // Invalidate and refetch queries
            queryClient.invalidateQueries({ queryKey }).then(() => {
              // Force refetch to ensure data is updated
              return queryClient.refetchQueries({ queryKey })
            }).catch((error) => {
              // Query invalidation/refetch failed
            })

            // Call custom event handler if provided
            if (onEvent) {
              onEvent(payload, events)
            }
          })
        })

        // Store subscription for cleanup
        subscriptionRefs.current.set(subscriptionKey, unsubscribe)
      } catch (error) {
        // Failed to create consolidated subscription
      }
    })

    // Cleanup function
    return () => {
      subscriptionRefs.current.forEach((unsubscribe) => {
        unsubscribe()
      })
      subscriptionRefs.current.clear()
    }
  }, [subscriptions, enabled, queryClient])

  // Return cleanup function for manual control
  return {
    cleanup: () => {
      subscriptionRefs.current.forEach((unsubscribe) => {
        unsubscribe()
      })
      subscriptionRefs.current.clear()
    }
  }
}

/**
 * Consolidated hook for both messages and notifications realtime
 * This reduces the number of realtime connections by combining both subscriptions
 * Supports both collections/documents and tables/rows for messages
 * @param userId User ID for notifications
 * @param blogId Blog ID for messages
 * @param articleId Article ID for messages
 * @param conversationId Conversation ID for messages
 * @param enabled Whether subscriptions should be active
 */
export function useMessagesAndNotificationsRealtime(
  userId: string,
  blogId?: string,
  articleId?: string,
  conversationId?: string,
  enabled: boolean = true
) {
  const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID
  const queryClient = useQueryClient()
  const messagesCollectionChannel = `databases.${databaseId}.collections.messages.documents`
  const messagesTableChannel = `databases.${databaseId}.tables.messages.rows`
  const notificationsCollectionChannel = `databases.${databaseId}.collections.notifications.documents`
  const notificationsTableChannel = `databases.${databaseId}.tables.notifications.rows`

  // Messages filter
  const messagesFilter = useMemo(() => (payload: any) => {
    if (!payload || typeof payload !== 'object') return false
    
    // Filter by blogId if provided
    if (blogId && payload.blogId !== blogId) {
      return false
    }
    
    // Filter by conversationId if provided (this is the primary filter)
    if (conversationId && payload.conversationId !== conversationId) {
      return false
    }
    
    // Additional validation: ensure we have the required fields
    if (!payload.conversationId || !payload.content || !payload.role) {
      return false
    }
    
    return true
  }, [blogId, conversationId])

  // Messages event handler with race condition protection
  const messagesOnEvent = useMemo(() => (payload: any, events: string[]) => {
    const queryKey = ['messages', conversationId || '']
    
    // Update the existing data optimistically without making API calls
    queryClient.setQueryData(queryKey, (oldData: any) => {
      if (!oldData?.documents) {
        return oldData
      }

      const messageId = payload.$id
      const isCreateEvent = events.some(event => event.includes('.create'))
      const isUpdateEvent = events.some(event => event.includes('.update'))

      if (isCreateEvent) {
        // Add new message to the beginning of the list
        return {
          ...oldData,
          documents: [payload, ...oldData.documents],
          total: oldData.total + 1
        }
      } else if (isUpdateEvent) {
        // Update existing message
        const messageIndex = oldData.documents.findIndex((msg: any) => msg.$id === messageId)
        if (messageIndex !== -1) {
          const updatedDocuments = [...oldData.documents]
          updatedDocuments[messageIndex] = payload
          return {
            ...oldData,
            documents: updatedDocuments
          }
        }
      }

      return oldData
    })

  }, [conversationId, queryClient])

  // Notifications filter
  const notificationsFilter = useMemo(() => (payload: any) => {
    return payload && typeof payload === 'object' && 'userId' in payload && payload.userId === userId
  }, [userId])

  // Notifications event handler
  const notificationsOnEvent = useMemo(() => (payload: any, events: string[]) => {
    // Show toast for new notifications (only for create events)
    if (events.some(event => event.includes('.create'))) {
      // Import toast dynamically to avoid circular dependencies
      import('@/hooks/use-toast').then(({ toast }) => {
        toast({
          title: 'New notification',
          description: payload.title || 'You have a new notification',
          duration: 3000,
        })
      })
    }
  }, [])

  // Create consolidated subscriptions
  const subscriptions = useMemo(() => {
    const subs: RealtimeSubscription[] = []
    
    // Add messages subscription (collection only to avoid duplicates) if conversationId is provided
    if (conversationId) {
      subs.push({
        channel: messagesCollectionChannel,
        queryKey: ['messages', conversationId],
        filter: messagesFilter,
        onEvent: messagesOnEvent
      })
    }
    
    // Add notifications subscriptions (both collection and table)
    subs.push({
      channel: notificationsCollectionChannel,
      queryKey: ['notifications', userId],
      filter: notificationsFilter,
      onEvent: notificationsOnEvent
    })
    subs.push({
      channel: notificationsTableChannel,
      queryKey: ['notifications', userId],
      filter: notificationsFilter,
      onEvent: notificationsOnEvent
    })
    
    return subs
  }, [
    messagesCollectionChannel, 
    messagesTableChannel, 
    notificationsCollectionChannel, 
    notificationsTableChannel, 
    conversationId, 
    userId, 
    messagesFilter, 
    messagesOnEvent,
    notificationsFilter, 
    notificationsOnEvent
  ])

  return useConsolidatedRealtime(subscriptions, enabled)
}

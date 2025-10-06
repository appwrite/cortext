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
    console.log('useRealtime effect triggered:', { 
      enabled, 
      subscriptionsCount: subscriptions.length,
      subscriptions: subscriptions.map(s => ({ channel: s.channel, queryKey: s.queryKey }))
    })
    if (!enabled) {
      console.log('Realtime disabled, skipping subscription setup')
      return
    }

    // Subscribe to all channels
    subscriptions.forEach(({ channel, queryKey, filter, onEvent }) => {
      const subscriptionKey = `${channel}-${queryKey.join('-')}`
      console.log('Processing subscription:', { channel, queryKey, subscriptionKey })
      
      // Clean up existing subscription if it exists
      if (subscriptionRefs.current.has(subscriptionKey)) {
        console.log('Cleaning up existing subscription:', subscriptionKey)
        const unsubscribe = subscriptionRefs.current.get(subscriptionKey)
        unsubscribe?.()
        subscriptionRefs.current.delete(subscriptionKey)
      }

      // Create new subscription
      console.log('Setting up realtime subscription:', { channel, queryKey, enabled })
      try {
        const unsubscribe = client.subscribe(channel, (response) => {
          console.log('Realtime event received:', { 
            channel, 
            events: response.events, 
            payload: response.payload,
            subscriptionKey 
          })
          const { payload, events } = response

          // Apply filter if provided
          if (filter && !filter(payload)) {
            console.log('Event filtered out by filter function')
            return
          }

          console.log('Invalidating queries:', queryKey)
          // Invalidate and refetch queries
          queryClient.invalidateQueries({ queryKey }).then(() => {
            console.log('Query invalidation completed for:', queryKey)
            // Force refetch to ensure data is updated
            return queryClient.refetchQueries({ queryKey })
          }).then(() => {
            console.log('Query refetch completed for:', queryKey)
          }).catch((error) => {
            console.error('Query invalidation/refetch failed:', error)
          })

          // Call custom event handler if provided
          if (onEvent) {
            onEvent(payload, events)
          }
        })

        // Store subscription for cleanup
        subscriptionRefs.current.set(subscriptionKey, unsubscribe)
        console.log('Subscription created successfully:', subscriptionKey)
      } catch (error) {
        console.error('Failed to create subscription:', error)
      }
    })

    // Cleanup function
    return () => {
      console.log('Cleaning up all subscriptions')
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
  
  console.log('useMessagesRealtime called:', { 
    blogId, 
    articleId, 
    conversationId, 
    enabled, 
    databaseId, 
    messagesCollectionChannel,
    messagesTableChannel
  })

  const filter = useMemo(() => (payload: any) => {
    if (!payload || typeof payload !== 'object') return false
    
    // Filter by blogId if provided
    if (blogId && payload.blogId !== blogId) {
      console.log('Message filtered out: blogId mismatch', { 
        expected: blogId, 
        actual: payload.blogId,
        conversationId: payload.conversationId 
      })
      return false
    }
    
    // Filter by conversationId if provided (this is the primary filter)
    if (conversationId && payload.conversationId !== conversationId) {
      console.log('Message filtered out: conversationId mismatch', { 
        expected: conversationId, 
        actual: payload.conversationId,
        blogId: payload.blogId 
      })
      return false
    }
    
    // Additional validation: ensure we have the required fields
    if (!payload.conversationId || !payload.content || !payload.role) {
      console.log('Message filtered out: missing required fields', { 
        conversationId: payload.conversationId,
        hasContent: !!payload.content,
        hasRole: !!payload.role 
      })
      return false
    }
    
    // Log successful match for debugging
    console.log('Message accepted for realtime update', { 
      conversationId: payload.conversationId,
      blogId: payload.blogId,
      role: payload.role,
      contentLength: payload.content?.length,
      updatedAt: payload.$updatedAt
    })
    
    // Note: articleId is passed for context but messages are filtered by conversationId
    // The conversationId already ensures we only get messages for the correct article
    // since conversations are article-specific. This provides an additional layer of
    // security to ensure messages only appear in the correct UI context.
    
    return true
  }, [blogId, conversationId])

  // Custom event handler for optimistic updates with race condition protection
  const onEvent = useMemo(() => (payload: any, events: string[]) => {
    const queryKey = ['messages', conversationId || '']
    
    // Only handle update events for existing messages
    const isUpdateEvent = events.some(event => event.includes('.update'))
    if (!isUpdateEvent) {
      // For create events, use the standard invalidation approach
      console.log('Message create event - using standard invalidation')
      queryClient.invalidateQueries({ queryKey }).then(() => {
        return queryClient.refetchQueries({ queryKey })
      })
      return
    }

    console.log('Message update event - using optimistic update with race condition protection', {
      messageId: payload.$id,
      updatedAt: payload.$updatedAt,
      events
    })

    // For update events, use optimistic updates with timestamp validation
    // We need to handle all possible query keys that might contain this message
    const allQueryKeys = [
      ['messages', conversationId || ''],
      ['messages', conversationId || '', 0], // First page
      ['messages', conversationId || '', 25], // Second page
      ['messages', conversationId || '', 50], // Third page
      // Add more offsets as needed, or use a more dynamic approach
    ]

    allQueryKeys.forEach(key => {
      queryClient.setQueryData(key, (oldData: any) => {
        if (!oldData?.documents) {
          console.log('No existing data found for query key:', key)
          return oldData
        }

        const messageId = payload.$id
        const newUpdatedAt = new Date(payload.$updatedAt).getTime()
        
        // Find the existing message
        const existingMessageIndex = oldData.documents.findIndex((msg: any) => msg.$id === messageId)
        
        if (existingMessageIndex === -1) {
          console.log('Message not found in existing data for query key:', key)
          return oldData
        }

        const existingMessage = oldData.documents[existingMessageIndex]
        const existingUpdatedAt = new Date(existingMessage.$updatedAt).getTime()
        
        // Only update if the new message is newer (race condition protection)
        if (newUpdatedAt > existingUpdatedAt) {
          console.log('Updating message with newer timestamp', {
            messageId,
            existingUpdatedAt: new Date(existingUpdatedAt).toISOString(),
            newUpdatedAt: new Date(newUpdatedAt).toISOString(),
            queryKey: key
          })
          
          // Create updated documents array with the new message
          const updatedDocuments = [...oldData.documents]
          updatedDocuments[existingMessageIndex] = payload
          
          return {
            ...oldData,
            documents: updatedDocuments
          }
        } else {
          console.log('Ignoring older message update (race condition protection)', {
            messageId,
            existingUpdatedAt: new Date(existingUpdatedAt).toISOString(),
            newUpdatedAt: new Date(newUpdatedAt).toISOString(),
            queryKey: key
          })
          
          // Keep existing data unchanged
          return oldData
        }
      })
    })
  }, [conversationId, queryClient])

  const queryKey = useMemo(() => ['messages', conversationId || ''], [conversationId])
  
  console.log('useMessagesRealtime queryKey:', queryKey)

  // Create subscriptions for both collections and tables
  const subscriptions = useMemo(() => [
    { 
      channel: messagesCollectionChannel, 
      queryKey, 
      filter,
      onEvent
    },
    { 
      channel: messagesTableChannel, 
      queryKey, 
      filter,
      onEvent
    }
  ], [messagesCollectionChannel, messagesTableChannel, queryKey, filter, onEvent])

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
    console.log('useConsolidatedRealtime effect triggered:', { 
      enabled, 
      subscriptionsCount: subscriptions.length,
      subscriptions: subscriptions.map(s => ({ channel: s.channel, queryKey: s.queryKey }))
    })
    
    if (!enabled) {
      console.log('Consolidated realtime disabled, skipping subscription setup')
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

    console.log('Channel groups:', Array.from(channelGroups.keys()))

    // Subscribe to each unique channel
    channelGroups.forEach((channelSubscriptions, channel) => {
      const subscriptionKey = `consolidated-${channel}`
      console.log('Processing consolidated subscription:', { channel, subscriptionKey, count: channelSubscriptions.length })
      
      // Clean up existing subscription if it exists
      if (subscriptionRefs.current.has(subscriptionKey)) {
        console.log('Cleaning up existing consolidated subscription:', subscriptionKey)
        const unsubscribe = subscriptionRefs.current.get(subscriptionKey)
        unsubscribe?.()
        subscriptionRefs.current.delete(subscriptionKey)
      }

      // Create new consolidated subscription
      console.log('Setting up consolidated realtime subscription:', { channel, enabled })
      try {
        const unsubscribe = client.subscribe(channel, (response) => {
          console.log('Consolidated realtime event received:', { 
            channel, 
            events: response.events, 
            payload: response.payload,
            subscriptionKey 
          })
          const { payload, events } = response

          // Process each subscription for this channel
          channelSubscriptions.forEach(({ queryKey, filter, onEvent }) => {
            // Apply filter if provided
            if (filter && !filter(payload)) {
              console.log('Event filtered out by filter function for queryKey:', queryKey)
              return
            }

            console.log('Invalidating queries for consolidated subscription:', queryKey)
            // Invalidate and refetch queries
            queryClient.invalidateQueries({ queryKey }).then(() => {
              console.log('Query invalidation completed for consolidated subscription:', queryKey)
              // Force refetch to ensure data is updated
              return queryClient.refetchQueries({ queryKey })
            }).then(() => {
              console.log('Query refetch completed for consolidated subscription:', queryKey)
            }).catch((error) => {
              console.error('Query invalidation/refetch failed for consolidated subscription:', error)
            })

            // Call custom event handler if provided
            if (onEvent) {
              onEvent(payload, events)
            }
          })
        })

        // Store subscription for cleanup
        subscriptionRefs.current.set(subscriptionKey, unsubscribe)
        console.log('Consolidated subscription created successfully:', subscriptionKey)
      } catch (error) {
        console.error('Failed to create consolidated subscription:', error)
      }
    })

    // Cleanup function
    return () => {
      console.log('Cleaning up all consolidated subscriptions')
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
    
    // Only handle update events for existing messages
    const isUpdateEvent = events.some(event => event.includes('.update'))
    if (!isUpdateEvent) {
      // For create events, use the standard invalidation approach
      console.log('Message create event - using standard invalidation')
      queryClient.invalidateQueries({ queryKey }).then(() => {
        return queryClient.refetchQueries({ queryKey })
      })
      return
    }

    console.log('Message update event - using optimistic update with race condition protection', {
      messageId: payload.$id,
      updatedAt: payload.$updatedAt,
      events
    })

    // For update events, use optimistic updates with timestamp validation
    // We need to handle all possible query keys that might contain this message
    const allQueryKeys = [
      ['messages', conversationId || ''],
      ['messages', conversationId || '', 0], // First page
      ['messages', conversationId || '', 25], // Second page
      ['messages', conversationId || '', 50], // Third page
      // Add more offsets as needed, or use a more dynamic approach
    ]

    allQueryKeys.forEach(key => {
      queryClient.setQueryData(key, (oldData: any) => {
        if (!oldData?.documents) {
          console.log('No existing data found for query key:', key)
          return oldData
        }

        const messageId = payload.$id
        const newUpdatedAt = new Date(payload.$updatedAt).getTime()
        
        // Find the existing message
        const existingMessageIndex = oldData.documents.findIndex((msg: any) => msg.$id === messageId)
        
        if (existingMessageIndex === -1) {
          console.log('Message not found in existing data for query key:', key)
          return oldData
        }

        const existingMessage = oldData.documents[existingMessageIndex]
        const existingUpdatedAt = new Date(existingMessage.$updatedAt).getTime()
        
        // Only update if the new message is newer (race condition protection)
        if (newUpdatedAt > existingUpdatedAt) {
          console.log('Updating message with newer timestamp', {
            messageId,
            existingUpdatedAt: new Date(existingUpdatedAt).toISOString(),
            newUpdatedAt: new Date(newUpdatedAt).toISOString(),
            queryKey: key
          })
          
          // Create updated documents array with the new message
          const updatedDocuments = [...oldData.documents]
          updatedDocuments[existingMessageIndex] = payload
          
          return {
            ...oldData,
            documents: updatedDocuments
          }
        } else {
          console.log('Ignoring older message update (race condition protection)', {
            messageId,
            existingUpdatedAt: new Date(existingUpdatedAt).toISOString(),
            newUpdatedAt: new Date(newUpdatedAt).toISOString(),
            queryKey: key
          })
          
          // Keep existing data unchanged
          return oldData
        }
      })
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
    
    // Add messages subscriptions (both collection and table) if conversationId is provided
    if (conversationId) {
      subs.push({
        channel: messagesCollectionChannel,
        queryKey: ['messages', conversationId],
        filter: messagesFilter,
        onEvent: messagesOnEvent
      })
      subs.push({
        channel: messagesTableChannel,
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

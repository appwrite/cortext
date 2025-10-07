import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import React, { useState, useCallback, useEffect } from 'react'
import { db } from '@/lib/appwrite/db'
import { Query } from 'appwrite'
import { useMessagesAndNotificationsRealtime } from './use-realtime'
import type { Conversations, Messages } from '@/lib/appwrite/appwrite.types'

export function useConversations(articleId: string, userId: string) {
  const queryClient = useQueryClient()

  // Get all conversations for an article
  const conversationsQuery = useQuery({
    queryKey: ['conversations', articleId],
    queryFn: () => 
      db.conversations.list([
        Query.equal('articleId', articleId),
        Query.orderDesc('lastMessageAt')
      ]),
    enabled: !!articleId,
  })

  // Create a new conversation
  const createConversationMutation = useMutation({
    mutationFn: async (data: { title: string; blogId?: string }) => {
      return db.conversations.create({
        articleId,
        title: data.title,
        userId: userId,
        agentId: 'temp-agent-id', // Temporary fake ID
        blogId: data.blogId || null,
        lastMessageAt: new Date().toISOString(),
        messageCount: 0,
      }, userId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', articleId] })
    },
  })

  // Update conversation
  const updateConversationMutation = useMutation({
    mutationFn: async ({ 
      conversationId, 
      data 
    }: { 
      conversationId: string; 
      data: Partial<Omit<Conversations, keyof any>> 
    }) => {
      return db.conversations.update(conversationId, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', articleId] })
    },
  })

  return {
    conversations: conversationsQuery.data?.documents || [],
    isLoadingConversations: conversationsQuery.isLoading,
    createConversation: createConversationMutation.mutateAsync,
    updateConversation: updateConversationMutation.mutateAsync,
    isCreatingConversation: createConversationMutation.isPending,
  }
}

export function useMessages(conversationId: string | null, blogId?: string, articleId?: string) {
  const queryClient = useQueryClient()
  const [offset, setOffset] = useState(0)
  const [allMessages, setAllMessages] = useState<Messages[]>([])
  const [hasMoreMessages, setHasMoreMessages] = useState(true)

  // Get all messages for a conversation
  const queryKey = ['messages', conversationId, offset]
  
  const messagesQuery = useQuery({
    queryKey,
    queryFn: () => {
      return db.messages.list([
        Query.equal('conversationId', conversationId!),
        Query.orderDesc('$createdAt'),
        Query.limit(25),
        Query.offset(offset)
      ])
    },
    enabled: !!conversationId,
    refetchInterval: false, // Disable polling since we're using realtime
  })


  // Handle pagination logic
  const handleMessagesData = useCallback(() => {
    if (messagesQuery.data?.documents) {
      const newMessages = messagesQuery.data.documents
      const total = messagesQuery.data.total || 0
      
      if (offset === 0) {
        // First load - replace all messages
        setAllMessages(newMessages)
      } else {
        // Load more - append older messages to the beginning and sort the entire list
        setAllMessages(prev => {
          const combined = [...newMessages, ...prev]
          // Sort by createdAt in descending order (newest first) since API returns newest first
          return combined.sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime())
        })
      }
      
      // Check if there are more messages to load
      const currentTotal = offset + newMessages.length
      setHasMoreMessages(currentTotal < total)
    }
  }, [messagesQuery.data, offset])

  // Update messages when data changes
  useEffect(() => {
    handleMessagesData()
  }, [handleMessagesData])

  // Reset pagination when conversation changes
  useEffect(() => {
    if (conversationId) {
      setOffset(0)
      setAllMessages([])
      setHasMoreMessages(true)
      // Force refetch when switching conversations
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
    }
  }, [conversationId, queryClient])

  // Load more messages function
  const loadMoreMessages = useCallback(() => {
    if (hasMoreMessages && !messagesQuery.isFetching) {
      setOffset(prev => prev + 25)
    }
  }, [hasMoreMessages, messagesQuery.isFetching])

  // Create a new message
  const createMessageMutation = useMutation({
    mutationFn: async (data: { 
      role: 'user' | 'assistant'; 
      content: string; 
      metadata?: any;
      userId: string;
    }) => {
      if (!conversationId) throw new Error('No conversation selected')
      
      const message = await db.messages.create({
        conversationId,
        role: data.role,
        content: data.content,
        userId: data.userId,
        agentId: 'temp-agent-id', // Temporary fake ID
        blogId: blogId || null,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        tokenCount: null, // Will be updated by the agent
        generationTimeMs: null, // Will be updated by the agent
      }, data.userId)

      return message
    },
    onSuccess: (message) => {
      // Don't invalidate messages query since we're using realtime
      // Only invalidate conversations to update the list
      queryClient.invalidateQueries({ queryKey: ['conversations'] }).then(() => {
      })
    },
    onError: (error) => {
    },
  })

  return {
    messages: allMessages,
    isLoadingMessages: messagesQuery.isLoading,
    isLoadingMoreMessages: messagesQuery.isFetching && offset > 0,
    hasMoreMessages,
    loadMoreMessages,
    createMessage: createMessageMutation.mutateAsync,
    isCreatingMessage: createMessageMutation.isPending,
  }
}

export function useConversationManager(articleId: string, userId: string) {
  const {
    conversations,
    isLoadingConversations,
    createConversation,
    updateConversation,
    isCreatingConversation,
  } = useConversations(articleId, userId)

  // Get the first conversation or create one if none exist
  const getOrCreateFirstConversation = async (blogId?: string) => {
    if (conversations.length === 0) {
      return await createConversation({
        title: 'New conversation',
        blogId,
      })
    }
    return conversations[0]
  }

  return {
    conversations,
    isLoadingConversations,
    createConversation,
    updateConversation,
    isCreatingConversation,
    getOrCreateFirstConversation,
  }
}

/**
 * Consolidated hook for messages with notifications realtime
 * This reduces the number of realtime connections by combining both subscriptions
 * @param conversationId Conversation ID for messages
 * @param blogId Blog ID for messages
 * @param articleId Article ID for messages
 * @param userId User ID for notifications
 * @param enabled Whether subscriptions should be active
 */
export function useMessagesWithNotifications(
  conversationId: string | null, 
  blogId?: string, 
  articleId?: string, 
  userId?: string,
  enabled: boolean = true
) {
  const queryClient = useQueryClient()
  const [allMessages, setAllMessages] = useState<Messages[]>([])
  const [isSwitchingConversation, setIsSwitchingConversation] = useState(false)
  
  // Cache messages per conversation to prevent state loss when switching
  const [conversationCache, setConversationCache] = useState<Map<string, Messages[]>>(new Map())

  // Get last 200 messages for a conversation
  const messagesQuery = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => {
      console.log('🔍 useMessagesWithNotifications: Fetching last 200 messages for conversation:', conversationId)
      return db.messages.list([
        Query.equal('conversationId', conversationId!),
        Query.orderDesc('$createdAt'),
        Query.limit(200)
      ])
    },
    enabled: !!conversationId,
    refetchInterval: false,
  })

  // Handle messages data - simplified approach
  const handleMessagesData = useCallback(() => {
    if (!messagesQuery.data?.documents || !conversationId) {
      return
    }

    const newMessages = messagesQuery.data.documents

    console.log('📨 Processing messages data:', {
      conversationId,
      newMessagesCount: newMessages.length,
      currentMessagesCount: allMessages.length
    })

    // Replace all messages with the latest batch
    setAllMessages(newMessages)
    
    // Cache the data
    setConversationCache(prev => {
      const newCache = new Map(prev)
      newCache.set(conversationId, newMessages)
      return newCache
    })
    
    setIsSwitchingConversation(false)
  }, [messagesQuery.data, conversationId, allMessages])

  // Update messages when data changes
  useEffect(() => {
    handleMessagesData()
  }, [handleMessagesData])

  // Handle conversation changes with caching
  useEffect(() => {
    if (conversationId) {
      console.log('🔄 useMessagesWithNotifications: Conversation changed to:', conversationId)
      
      // Check if we have cached data for this conversation
      const cached = conversationCache.get(conversationId)
      if (cached) {
        console.log('📦 Loading from cache for conversation:', conversationId)
        setAllMessages(cached)
        setIsSwitchingConversation(false)
      } else {
        console.log('🔄 No cache found, resetting for conversation:', conversationId)
        setIsSwitchingConversation(true)
        // Force refetch when switching conversations
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
      }
    } else {
      // No conversation selected, reset everything
      setIsSwitchingConversation(false)
      setAllMessages([])
    }
  }, [conversationId, queryClient, conversationCache])

  // Set up consolidated realtime subscription for both messages and notifications
  useMessagesAndNotificationsRealtime(
    userId || '', 
    blogId, 
    articleId, 
    conversationId || undefined, 
    !!conversationId && !!userId && enabled
  )


  // Create a new message
  const createMessageMutation = useMutation({
    mutationFn: async (data: { 
      role: 'user' | 'assistant'; 
      content: string; 
      metadata?: any;
      userId: string;
    }) => {
      if (!conversationId) throw new Error('No conversation selected')
      
      const message = await db.messages.create({
        conversationId,
        role: data.role,
        content: data.content,
        userId: data.userId,
        agentId: 'temp-agent-id', // Temporary fake ID
        blogId: blogId || null,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        tokenCount: null, // Will be updated by the agent
        generationTimeMs: null, // Will be updated by the agent
      }, data.userId)

      // Update conversation's last message time and count
      await db.conversations.update(conversationId, {
        lastMessageAt: new Date().toISOString(),
        messageCount: (messagesQuery.data?.total || 0) + 1,
      })

      return message
    },
    onSuccess: (message) => {
      // Don't invalidate messages query since we're using realtime
      // Only invalidate conversations to update the list
      queryClient.invalidateQueries({ queryKey: ['conversations'] }).then(() => {
      })
    },
    onError: (error) => {
    },
  })

  return {
    messages: allMessages,
    isLoadingMessages: messagesQuery.isLoading || isSwitchingConversation,
    createMessage: createMessageMutation.mutateAsync,
    isCreatingMessage: createMessageMutation.isPending,
  }
}

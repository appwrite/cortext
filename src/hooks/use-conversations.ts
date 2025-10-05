import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '@/lib/appwrite/db'
import { Query } from 'appwrite'
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

export function useMessages(conversationId: string | null, blogId?: string) {
  const queryClient = useQueryClient()

  // Get all messages for a conversation
  const messagesQuery = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => 
      db.messages.list([
        Query.equal('conversationId', conversationId!),
        Query.orderAsc('$createdAt')
      ]),
    enabled: !!conversationId,
  })

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
      }, data.userId)

      // Update conversation's last message time and count
      await db.conversations.update(conversationId, {
        lastMessageAt: new Date().toISOString(),
        messageCount: (messagesQuery.data?.total || 0) + 1,
      })

      return message
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  return {
    messages: messagesQuery.data?.documents || [],
    isLoadingMessages: messagesQuery.isLoading,
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

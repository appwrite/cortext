import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { Brain, Sparkles, Send, MessageCircle, CornerDownLeft, Code } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { useConversationManager, useMessagesWithNotifications } from '@/hooks/use-conversations'
import { ConversationSelector } from './conversation-selector'
import { ConversationPlaceholder } from './conversation-placeholder'
import { useAuth } from '@/hooks/use-auth'
import { useDebugMode } from '@/contexts/debug-context'
import { useLatestRevision } from '@/hooks/use-latest-revision'
import type { Messages } from '@/lib/appwrite/appwrite.types'
import { functionService } from '@/lib/appwrite/functions'
import { db } from '@/lib/appwrite/db'
import { formatDuration } from '@/lib/date-utils'
import { AIMessageRenderer } from './ai-message-renderer'
import { AIChangeIndicators } from './ai-change-indicators'
import { useQueryClient } from '@tanstack/react-query'

type Message = {
    id: string
    role: 'user' | 'assistant'
    content: string
    createdAt: string
    tokenCount?: number | null
    generationTimeMs?: number | null
    revisionId?: string | null
    metadata?: {
        streaming?: boolean
        status?: 'generating' | 'completed' | 'error'
        chunkCount?: number
        tokensUsed?: number
        isMock?: boolean
    }
}

export function AgentChat({
    title,
    onSetTitle,
    onSetSubtitle,
    articleId,
    blogId,
    onApplyAIRevision,
    debugMode = false,
}: {
    title: string
    subtitle: string
    onSetTitle: (t: string) => void
    onSetSubtitle: (s: string) => void
    articleId: string
    blogId?: string
    onApplyAIRevision?: (revisionId: string) => void
    debugMode?: boolean
}) {
    const { user } = useAuth()
    const { latestRevision } = useLatestRevision(articleId)
    const queryClient = useQueryClient()
    const [input, setInput] = useState('')
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [isWaitingForAI, setIsWaitingForAI] = useState(false)
    const [previousMessageCount, setPreviousMessageCount] = useState(0)
    const [previousAssistantCount, setPreviousAssistantCount] = useState(0)
    const [lastProcessedRevisionId, setLastProcessedRevisionId] = useState<string | null>(null)
    const [previousAssistantMessages, setPreviousAssistantMessages] = useState<Messages[]>([])
    const [isStreaming, setIsStreaming] = useState(false)
    const [isWaitingForStream, setIsWaitingForStream] = useState(false)
    const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
    const [debugEvents, setDebugEvents] = useState<string[]>([])
    const [lastStreamingContent, setLastStreamingContent] = useState<string>('')
    const [streamingContentCheckCount, setStreamingContentCheckCount] = useState(0)
    const [lastMetadataStatus, setLastMetadataStatus] = useState<string>('None')
    const { isDebugMode: showDebugPanel, setDebugMode: setShowDebugPanel } = useDebugMode()
    const [totalCost, setTotalCost] = useState<number>(0)
    const [totalTokens, setTotalTokens] = useState<number>(0)
    const [totalInputTokens, setTotalInputTokens] = useState<number>(0)
    const [totalOutputTokens, setTotalOutputTokens] = useState<number>(0)
    const [rawMessageModalOpen, setRawMessageModalOpen] = useState<boolean>(false)
    const [selectedMessageForRaw, setSelectedMessageForRaw] = useState<Message | null>(null)
    const isMobile = useIsMobile()
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const currentConversationIdRef = useRef<string | null>(currentConversationId)
    const isStreamingRef = useRef<boolean>(false)

    // Update ref when conversation ID changes and clear streaming state
    useEffect(() => {
        currentConversationIdRef.current = currentConversationId
        // Clear streaming state when switching conversations
        setIsStreaming(false)
        setIsWaitingForStream(false)
        setStreamingMessageId(null)
        setLastStreamingContent('')
        setStreamingContentCheckCount(0)
        setLastMetadataStatus('None')
        isStreamingRef.current = false
    }, [currentConversationId])

    // Update streaming ref whenever streaming state changes
    useEffect(() => {
        isStreamingRef.current = isStreaming
    }, [isStreaming])

    // Calculate total cost from all messages
    const calculateTotalCost = useCallback((messages: Message[]) => {
        let totalCost = 0
        let totalTokens = 0
        let totalInputTokens = 0
        let totalOutputTokens = 0

        messages.forEach(message => {
            if (message.metadata) {
                try {
                    const metadata = typeof message.metadata === 'string' 
                        ? JSON.parse(message.metadata) 
                        : message.metadata
                    
                    if (metadata.estimatedCost) {
                        totalCost += metadata.estimatedCost
                    }
                    if (metadata.totalTokens) {
                        totalTokens += metadata.totalTokens
                    }
                    if (metadata.inputTokens) {
                        totalInputTokens += metadata.inputTokens
                    }
                    if (metadata.outputTokens) {
                        totalOutputTokens += metadata.outputTokens
                    }
                } catch (e) {
                    // Ignore parsing errors
                }
            }
        })

        return { totalCost, totalTokens, totalInputTokens, totalOutputTokens }
    }, [])

    // Handle viewing raw message data
    const handleViewRawMessage = useCallback((message: Message) => {
        setSelectedMessageForRaw(message)
        setRawMessageModalOpen(true)
    }, [])


    // Scroll to bottom function
    const scrollToBottom = useCallback(() => {
        if (scrollAreaRef.current) {
            const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
            if (scrollElement) {
                scrollElement.scrollTo({
                    top: scrollElement.scrollHeight,
                    behavior: 'smooth'
                })
            }
        }
    }, [])

    const {
        conversations,
        isLoadingConversations,
        createConversation,
        updateConversation,
        deleteConversation,
        isDeletingConversation,
    } = useConversationManager(articleId, user?.$id || '')

    // Handle conversation edit
    const handleEditConversation = useCallback(async (conversationId: string, newTitle: string) => {
        try {
            await updateConversation({
                conversationId,
                data: { title: newTitle.trim() }
            })
        } catch (error) {
            console.error('Failed to update conversation:', error)
        }
    }, [updateConversation])

    // Handle conversation delete
    const handleDeleteConversation = useCallback(async (conversationId: string) => {
        try {
            await deleteConversation(conversationId)
            // If we're deleting the current conversation, switch to another one
            if (currentConversationId === conversationId) {
                const remainingConversations = conversations.filter(c => c.$id !== conversationId)
                if (remainingConversations.length > 0) {
                    setCurrentConversationId(remainingConversations[0].$id)
                } else {
                    // If no conversations remain, create a new one automatically
                    try {
                        const newConversation = await createConversation({
                            title: 'New conversation',
                            blogId,
                        })
                        setCurrentConversationId(newConversation.$id)
                    } catch (createError) {
                        console.error('Failed to create new conversation after deletion:', createError)
                        setCurrentConversationId(null)
                    }
                }
            }
        } catch (error) {
            console.error('Failed to delete conversation:', error)
        }
    }, [conversations, currentConversationId, deleteConversation, createConversation, blogId])

    // Streaming state callbacks for the consolidated realtime system
    const streamingCallbacks = useMemo(() => ({
        onStreamingStart: (messageId: string, metadata: any) => {
            setIsWaitingForStream(false)
            setIsStreaming(true)
            setStreamingMessageId(messageId)
            
            // Update metadata status for create event too
            if (metadata) {
                const statusText = metadata.status || 'unknown'
                const streamingText = metadata.streaming ? 'streaming' : 'not-streaming'
                setLastMetadataStatus(`${statusText} (${streamingText})`)
            }
            
            setDebugEvents(prev => [...prev.slice(-4), `Streaming started: ${messageId} at ${new Date().toISOString()}`])
        },
        onStreamingUpdate: (messageId: string, metadata: any, content: string) => {
            // Check if this is the streaming message we're tracking
            const isStreamingMessage = messageId === streamingMessageId
            
            // Update last metadata status for debug
            if (metadata) {
                const statusText = metadata.status || 'unknown'
                const streamingText = metadata.streaming ? 'streaming' : 'not-streaming'
                setLastMetadataStatus(`${statusText} (${streamingText})`)
            }
            
            // If this is our streaming message, check for completion
            if (isStreamingMessage) {
                // Check if content has changed (still streaming)
                if (content !== lastStreamingContent) {
                    setLastStreamingContent(content)
                    setStreamingContentCheckCount(0)
                } else {
                    // Content hasn't changed, increment check count
                    setStreamingContentCheckCount(prev => prev + 1)
                }
                
                // Complete if metadata says so OR if content hasn't changed for 3 updates
                if (metadata?.status === 'completed' || !metadata?.streaming || streamingContentCheckCount >= 3) {
                    setIsStreaming(false)
                    setIsWaitingForStream(false) // Also reset waiting state
                    setStreamingMessageId(null)
                    setLastStreamingContent('')
                    setStreamingContentCheckCount(0)
                    setDebugEvents(prev => [...prev.slice(-4), `Streaming completed: ${messageId} at ${new Date().toISOString()}`])
                }
            }
            
            // Also check if any assistant message has completed status (fallback)
            if (metadata?.status === 'completed' && isStreamingRef.current) {
                setIsStreaming(false)
                setIsWaitingForStream(false)
                setStreamingMessageId(null)
                setLastStreamingContent('')
                setStreamingContentCheckCount(0)
                setDebugEvents(prev => [...prev.slice(-4), `Streaming completed via fallback: ${messageId} at ${new Date().toISOString()}`])
            }
        },
        onStreamingComplete: (messageId: string, metadata: any) => {
            setIsStreaming(false)
            setIsWaitingForStream(false)
            setStreamingMessageId(null)
            setLastStreamingContent('')
            setStreamingContentCheckCount(0)
            setDebugEvents(prev => [...prev.slice(-4), `Streaming completed: ${messageId} at ${new Date().toISOString()}`])
        },
        onMetadataUpdate: (metadata: any) => {
            if (metadata) {
                const statusText = metadata.status || 'unknown'
                const streamingText = metadata.streaming ? 'streaming' : 'not-streaming'
                setLastMetadataStatus(`${statusText} (${streamingText})`)
                
                // If we detect completed status and we're currently streaming, reset streaming state
                if (metadata.status === 'completed' && isStreamingRef.current) {
                    setIsStreaming(false)
                    setIsWaitingForStream(false)
                    setStreamingMessageId(null)
                    setLastStreamingContent('')
                    setStreamingContentCheckCount(0)
                    setDebugEvents(prev => [...prev.slice(-4), `Streaming completed via metadata fallback at ${new Date().toISOString()}`])
                }
            }
        }
    }), [streamingMessageId, lastStreamingContent, streamingContentCheckCount])

    const {
        messages: dbMessages,
        isLoadingMessages,
        createMessage,
        isCreatingMessage,
    } = useMessagesWithNotifications(currentConversationId, blogId, articleId, user?.$id, true, streamingCallbacks)

    // Streaming state management is now handled by the consolidated realtime system

    // Convert database messages to local format and sort with oldest at top
    const dbMessagesFormatted: Message[] = dbMessages
        .map((msg: Messages) => ({
            id: msg.$id,
            role: msg.role,
            content: msg.content,
            createdAt: msg.$createdAt,
            tokenCount: msg.tokenCount,
            generationTimeMs: msg.generationTimeMs,
            revisionId: msg.revisionId,
            metadata: msg.metadata ? JSON.parse(msg.metadata) : undefined,
        }))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) // Sort oldest to newest

    // Use database messages directly
    const messages: Message[] = dbMessagesFormatted

    // Update cost tracking when messages change
    useEffect(() => {
        const costData = calculateTotalCost(messages)
        setTotalCost(costData.totalCost)
        setTotalTokens(costData.totalTokens)
        setTotalInputTokens(costData.totalInputTokens)
        setTotalOutputTokens(costData.totalOutputTokens)
    }, [messages, calculateTotalCost])

    // Detect new revisions created by AI and trigger form refresh
    useEffect(() => {
        if (messages.length === 0) return

        // Check the latest assistant message for a new revision
        const latestAssistantMessage = messages
            .filter(m => m.role === 'assistant')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

        // Look for revisionId in the message (not metadata)
        if (latestAssistantMessage?.revisionId) {
            const newRevisionId = latestAssistantMessage.revisionId
            
            // Only process if this is a new revision we haven't seen before
            if (newRevisionId !== lastProcessedRevisionId) {
                
                // Apply AI revision
                applyAIRevision(newRevisionId)
                
                // Update the last processed revision ID
                setLastProcessedRevisionId(newRevisionId)
                
            } else {
            }
        } else {
        }
    }, [messages, lastProcessedRevisionId, articleId, queryClient])

    // Function to apply AI revision
    const applyAIRevision = useCallback(async (revisionId: string) => {
        try {
            
            if (onApplyAIRevision) {
                // Use the parent callback to apply the revision
                onApplyAIRevision(revisionId)
            } else {
                // Fallback: invalidate queries
                console.warn('⚠️ No onApplyAIRevision callback provided, using fallback')
                queryClient.invalidateQueries({ queryKey: ['revisions', articleId] })
                queryClient.invalidateQueries({ queryKey: ['article', articleId] })
                queryClient.invalidateQueries({ queryKey: ['latestRevision', articleId] })
            }

        } catch (error) {
            console.error('❌ Error applying AI revision:', error)
        }
    }, [articleId, queryClient, onApplyAIRevision])

    // Determine if prompt should be locked (waiting for stream or streaming)
    const isPromptLocked = isWaitingForStream || isStreaming


    // Memoize the conversation creation function to prevent infinite loops
    const createInitialConversation = useCallback(async () => {
        if (conversations.length === 0 && !currentConversationId && !isLoadingConversations) {
            try {
                const newConversation = await createConversation({
                    title: 'New conversation',
                    blogId,
                })
                setCurrentConversationId(newConversation.$id)
            } catch {
                // Failed to create initial conversation
            }
        }
    }, [conversations.length, currentConversationId, isLoadingConversations, createConversation, blogId])

    // Initialize conversation when component mounts or when conversations are loaded
    useEffect(() => {
        if (conversations.length > 0 && !currentConversationId) {
            setCurrentConversationId(conversations[0].$id)
        } else if (conversations.length === 0 && !currentConversationId && !isLoadingConversations) {
            createInitialConversation()
        }
    }, [conversations, currentConversationId, isLoadingConversations, createInitialConversation])

    // Show messages if they exist, otherwise show placeholder (only when not loading and conversations exist)
    const hasMessages = messages.length > 0
    const shouldShowPlaceholder = !isLoadingMessages && messages.length === 0 && conversations.length > 0
    

    // Precisely align with the app header; footer does not occupy the left rail
    const [topOffset, setTopOffset] = useState<number>(64) // header fallback

    useEffect(() => {
        const measure = () => {
            const headerEl = document.querySelector('header.sticky') as HTMLElement | null
            const headerH = headerEl?.getBoundingClientRect().height ?? 64
            setTopOffset(Math.round(headerH))
        }
        measure()

        let roHeader: ResizeObserver | null = null
        const headerEl = document.querySelector('header.sticky') as HTMLElement | null
        if ('ResizeObserver' in window && headerEl) {
            roHeader = new ResizeObserver(measure)
            roHeader.observe(headerEl)
        }
        window.addEventListener('resize', measure)
        return () => {
            roHeader?.disconnect()
            window.removeEventListener('resize', measure)
        }
    }, [])

    // Auto-scroll to newest message
    const bottomRef = useRef<HTMLDivElement | null>(null)
    const scrollAreaRef = useRef<HTMLDivElement | null>(null)
    const [lastScrollTime, setLastScrollTime] = useState(0)
    
    // Simple scroll to bottom when messages change
    useEffect(() => {
        if (messages.length > previousMessageCount) {
            const now = Date.now()
            // Prevent rapid scrolling by ensuring at least 50ms between scrolls
            if (now - lastScrollTime > 50) {
                setTimeout(() => {
                    scrollToBottom()
                    setLastScrollTime(Date.now())
                }, 10)
            }
        }
        setPreviousMessageCount(messages.length)
    }, [messages.length, scrollToBottom, lastScrollTime, previousMessageCount])

    // Scroll during streaming for better UX
    useEffect(() => {
        if (dbMessages.length > 0) {
            const lastMessage = dbMessages[dbMessages.length - 1]
            const metadata = lastMessage.metadata ? JSON.parse(lastMessage.metadata) : undefined
            if (lastMessage.role === 'assistant' && metadata?.streaming && metadata?.status === 'generating') {
                const now = Date.now()
                if (now - lastScrollTime > 50) {
                    setTimeout(() => {
                        scrollToBottom()
                        setLastScrollTime(Date.now())
                    }, 10)
                }
            }
        }
    }, [dbMessages, scrollToBottom, lastScrollTime])


    // Clear AI waiting state when a new assistant message arrives and starts streaming
    useEffect(() => {
        if (isWaitingForAI && dbMessages.length > 0) {
            // Count current assistant messages
            const currentAssistantCount = dbMessages.filter(msg => msg.role === 'assistant').length
            
            // Show alert only when a new assistant message arrives (not on user messages)
            if (currentAssistantCount > previousAssistantCount) {
                const currentAssistantMessages = dbMessages.filter(msg => msg.role === 'assistant')
                const newAssistantMessage = currentAssistantMessages.find(msg => 
                    !previousAssistantMessages.some(prevMsg => prevMsg.$id === msg.$id)
                )
                
                if (newAssistantMessage) {
                    // AI message arrived through realtime
                }
                
                setPreviousAssistantCount(currentAssistantCount)
                setPreviousAssistantMessages(currentAssistantMessages)
            }
            
            const lastDbMessage = dbMessages[dbMessages.length - 1]
            if (lastDbMessage.role === 'assistant') {
                // Only clear loading state when the message has actual content (not just placeholder)
                const hasRealContent = lastDbMessage.content && 
                    lastDbMessage.content.trim().length > 0 && 
                    lastDbMessage.content !== ''
                
                // Clear immediately when real AI message arrives (no timeout needed)
                if (hasRealContent) {
                    // Clear loading state when AI starts streaming real content
                    setIsWaitingForAI(false)
                    // Scroll to the new assistant message
                    setTimeout(() => {
                        scrollToBottom()
                        setLastScrollTime(Date.now())
                    }, 10) // Minimal delay for immediate scrolling
                }
            }
        }
        
        // Update previous counts and assistant messages
        setPreviousMessageCount(dbMessages.length)
        const currentAssistantCount = dbMessages.filter(msg => msg.role === 'assistant').length
        if (currentAssistantCount === previousAssistantCount) {
            // No new assistant messages, just update the current list
            const currentAssistantMessages = dbMessages.filter(msg => msg.role === 'assistant')
            setPreviousAssistantMessages(currentAssistantMessages)
        }
    }, [dbMessages, isWaitingForAI, scrollToBottom, previousAssistantCount])

    // Focus input when prompt lock is released (streaming completes)
    useEffect(() => {
        if (!isPromptLocked && inputRef.current) {
            // Focus the input when prompt becomes unlocked
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus()
                }
            }, 100)
        }
    }, [isPromptLocked])

    // Scroll to bottom when AI loading state changes
    useEffect(() => {
        if (isWaitingForAI) {
            // Scroll to show the loading indicator
            setTimeout(() => {
                scrollToBottom()
                setLastScrollTime(Date.now())
            }, 10)
        }
    }, [isWaitingForAI, scrollToBottom])

    // Fallback timeout to clear loading state (in case realtime doesn't work)
    useEffect(() => {
        if (isWaitingForAI) {
            const timeout = setTimeout(() => {
                setIsWaitingForAI(false)
                setIsWaitingForStream(false)
            }, 120000) // 120 second timeout

            return () => clearTimeout(timeout)
        }
    }, [isWaitingForAI])

    // Global keyboard lock when prompt is locked
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (isPromptLocked) {
                // Block Enter key globally when prompt is locked
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    e.stopPropagation()
                }
            }
        }

        if (isPromptLocked) {
            document.addEventListener('keydown', handleGlobalKeyDown, true)
            return () => {
                document.removeEventListener('keydown', handleGlobalKeyDown, true)
            }
        }
    }, [isPromptLocked])

    // Safety timeout to reset lock state if it gets stuck
    useEffect(() => {
        if (isPromptLocked) {
            const safetyTimeout = setTimeout(() => {
                setIsStreaming(false)
                setIsWaitingForStream(false)
                setStreamingMessageId(null)
                setLastStreamingContent('')
                setStreamingContentCheckCount(0)
                setLastMetadataStatus('None')
                isStreamingRef.current = false
            }, 120000) // 120 second safety timeout

            return () => clearTimeout(safetyTimeout)
        }
    }, [isPromptLocked])


    const send = async (messageText?: string) => {
        const text = (messageText || input).trim()
        if (!text || !currentConversationId) return

        // Clear input and show loading immediately for better UX
        setInput('')
        setIsWaitingForAI(true)
        setIsWaitingForStream(true)
        setDebugEvents(prev => [...prev.slice(-4), `Prompt submitted, waiting for stream at ${new Date().toISOString()}`])

        try {
            // Create user message in background
            const userMessage = await createMessage({
                role: 'user',
                content: text,
                userId: user?.$id || '',
                revisionId: latestRevision?.$id || null,
            })

            // Scroll immediately for better UX
            setTimeout(() => {
                scrollToBottom()
                setLastScrollTime(Date.now())
            }, 10)

            // Trigger agent function to generate response
            await functionService.triggerAgentResponse({
                conversationId: currentConversationId,
                blogId: blogId || '',
                agentId: 'dummy-agent',
                articleId: articleId,
                metadata: {
                    articleTitle: title,
                    userMessage: text
                }
            })
        } catch {
            // Failed to send message
            setIsWaitingForAI(false)
            setIsWaitingForStream(false)
        }
    }

    const applySEOTitle = async () => {
        const next = makeSEOTitle(title)
        onSetTitle(next)
        
        // Send a message about the title update
        const message = `Update the title to: "${next}"`
        send(message)
    }

    const generateMetaDescription = async () => {
        const base = title || 'this article'
        const next = `Learn about ${base.toLowerCase()} with practical insights, best practices, and actionable tips. Discover how to implement and optimize for better results.`
        onSetSubtitle(next)
        
        // Send a message about the meta description update
        const message = `Generate a meta description for this article`
        send(message)
    }

    // Mock message functions for debug mode
    const addMockUserMessage = async () => {
        if (!currentConversationId || !user?.$id) return
        try {
            await createMessage({
                role: 'user',
                content: 'This is a mock user message for testing the UI layout and behavior.',
                userId: user.$id,
                revisionId: latestRevision?.$id || null,
                metadata: { isMock: true }
            })
        } catch (error) {
            console.error('Failed to add mock user message:', error)
        }
    }

    const addMockAssistantMessage = async () => {
        if (!currentConversationId || !user?.$id) return
        try {
            await createMessage({
                role: 'assistant',
                content: 'This is a mock assistant response with regular text content for testing purposes.',
                userId: user.$id,
                revisionId: latestRevision?.$id || null,
                metadata: { 
                    isMock: true,
                    status: 'completed',
                    tokenCount: 25,
                    generationTimeMs: 1500
                }
            })
        } catch (error) {
            console.error('Failed to add mock assistant message:', error)
        }
    }

    const addMockAssistantWithChanges = async () => {
        if (!currentConversationId || !user?.$id) return
        try {
            await createMessage({
                role: 'assistant',
                content: `{"article": {"title": "Mock Article Title", "subtitle": "Mock subtitle for testing"}}
I've updated the article title and subtitle based on your request. The changes include a more engaging title and a descriptive subtitle that better represents the content.`,
                userId: user.$id,
                revisionId: latestRevision?.$id || null,
                metadata: { 
                    isMock: true,
                    status: 'completed',
                    tokenCount: 45,
                    generationTimeMs: 2200
                }
            })
        } catch (error) {
            console.error('Failed to add mock assistant with changes:', error)
        }
    }

    const addMockStreamingMessage = async () => {
        if (!currentConversationId || !user?.$id) return
        try {
            await createMessage({
                role: 'assistant',
                content: 'This is a mock streaming message that shows the writing indicator...',
                userId: user.$id,
                revisionId: latestRevision?.$id || null,
                metadata: { 
                    isMock: true,
                    streaming: true,
                    status: 'generating'
                }
            })
        } catch (error) {
            console.error('Failed to add mock streaming message:', error)
        }
    }

    const addMockErrorMessage = async () => {
        if (!currentConversationId || !user?.$id) return
        try {
            await createMessage({
                role: 'assistant',
                content: 'This is a mock error message that shows the error state.',
                userId: user.$id,
                revisionId: latestRevision?.$id || null,
                metadata: { 
                    isMock: true,
                    status: 'error'
                }
            })
        } catch (error) {
            console.error('Failed to add mock error message:', error)
        }
    }

    const addMockLongMessage = async () => {
        if (!currentConversationId || !user?.$id) return
        try {
            const longContent = `{"sections": [{"action": "create", "type": "paragraph", "content": "This is a very long mock message that contains multiple sections and extensive content to test how the collapsible green changes card behaves when there is a lot of text content that needs to be truncated and displayed with the expand/collapse functionality."}, {"action": "update", "type": "heading", "content": "Updated Heading"}, {"action": "create", "type": "quote", "content": "This is a quote section with additional content"}]}
I've made several changes to your content including creating new paragraphs, updating headings, and adding quote sections. The content has been restructured to improve readability and flow.`
            await createMessage({
                role: 'assistant',
                content: longContent,
                userId: user.$id,
                revisionId: latestRevision?.$id || null,
                metadata: { 
                    isMock: true,
                    status: 'completed',
                    tokenCount: 120,
                    generationTimeMs: 3500
                }
            })
        } catch (error) {
            console.error('Failed to add mock long message:', error)
        }
    }

    const addMockWaitingForStream = async () => {
        if (!currentConversationId || !user?.$id) return
        try {
            await createMessage({
                role: 'assistant',
                content: '',
                userId: user.$id,
                revisionId: latestRevision?.$id || null,
                metadata: { 
                    isMock: true,
                    streaming: true,
                    status: 'generating'
                }
            })
        } catch (error) {
            console.error('Failed to add mock waiting for stream message:', error)
        }
    }

    const addMockProcessingJSON = async () => {
        if (!currentConversationId || !user?.$id) return
        try {
            // Simulate incomplete JSON being processed
            const incompleteJSON = `{"article": {"title": "Processing Title", "subtitle": "Processing subtitle`
            await createMessage({
                role: 'assistant',
                content: incompleteJSON,
                userId: user.$id,
                revisionId: latestRevision?.$id || null,
                metadata: { 
                    isMock: true,
                    streaming: true,
                    status: 'generating',
                    processingJSON: true
                }
            })
        } catch (error) {
            console.error('Failed to add mock processing JSON message:', error)
        }
    }

    const chatContent = (
        <>
            <ScrollArea ref={scrollAreaRef} className="flex-1">
                {/* Debug panel - sticky to top */}
                {showDebugPanel && (
                    <div className="sticky top-0 z-10 p-4 mb-4 bg-purple-50/90 dark:bg-purple-950/50 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                                Debug
                                <span className="ml-2 text-xs font-normal text-purple-600 dark:text-purple-300">
                                    AI Chat
                                </span>
                            </h3>
                            <button 
                                onClick={() => setShowDebugPanel(false)}
                                className="text-xs text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200"
                            >
                                ×
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                                <div className="font-medium text-purple-700 dark:text-purple-300 mb-1">Conversation</div>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className="flex items-center gap-1">
                                            Title
                                            <div className="group relative">
                                                <span className="text-purple-500 dark:text-purple-400 cursor-help text-xs w-3 h-3 rounded-full border border-current flex items-center justify-center text-[8px]">i</span>
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                                    Current conversation title
                                                </div>
                                            </div>
                                        </span>
                                        <span className="font-mono text-xs">
                                            {conversations.find(c => c.$id === currentConversationId)?.title || 'None'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="flex items-center gap-1">
                                            ID
                                            <div className="group relative">
                                                <span className="text-purple-500 dark:text-purple-400 cursor-help text-xs w-3 h-3 rounded-full border border-current flex items-center justify-center text-[8px]">i</span>
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                                    Conversation ID (last 8 chars)
                                                </div>
                                            </div>
                                        </span>
                                        <span className="font-mono text-xs">
                                            {currentConversationId?.slice(-8) || 'None'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="font-medium text-purple-700 dark:text-purple-300 mb-1">Status</div>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className="flex items-center gap-1">
                                            Messages
                                            <div className="group relative">
                                                <span className="text-purple-500 dark:text-purple-400 cursor-help text-xs w-3 h-3 rounded-full border border-current flex items-center justify-center text-[8px]">i</span>
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                                    Total number of messages in conversation
                                                </div>
                                            </div>
                                        </span>
                                        <span className="text-blue-600 dark:text-blue-400">
                                            {messages.length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="flex items-center gap-1">
                                            State
                                            <div className="group relative">
                                                <span className="text-purple-500 dark:text-purple-400 cursor-help text-xs w-3 h-3 rounded-full border border-current flex items-center justify-center text-[8px]">i</span>
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                                    Current processing state
                                                </div>
                                            </div>
                                        </span>
                                        <span className={isStreaming ? 'text-yellow-600 dark:text-yellow-400' : isWaitingForStream ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}>
                                            {isStreaming ? 'Streaming' : isWaitingForStream ? 'Waiting' : 'Ready'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="flex items-center gap-1">
                                            Lock
                                            <div className="group relative">
                                                <span className="text-purple-500 dark:text-purple-400 cursor-help text-xs w-3 h-3 rounded-full border border-current flex items-center justify-center text-[8px]">i</span>
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                                    Whether input is locked during processing
                                                </div>
                                            </div>
                                        </span>
                                        <span className={isPromptLocked ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                                            {isPromptLocked ? 'Locked' : 'Unlocked'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-3 pt-2 border-t border-purple-200 dark:border-purple-700">
                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-4">
                                    <span className="text-purple-600 dark:text-purple-400 flex items-center gap-1">
                                        Cost
                                        <div className="group relative">
                                            <span className="text-purple-500 dark:text-purple-400 cursor-help text-xs w-3 h-3 rounded-full border border-current flex items-center justify-center text-[8px]">i</span>
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                                Total cost of AI requests
                                            </div>
                                        </div>
                                        : <span className="text-blue-600 dark:text-blue-400">${totalCost.toFixed(6)}</span>
                                    </span>
                                    <span className="text-purple-600 dark:text-purple-400 flex items-center gap-1">
                                        Tokens
                                        <div className="group relative">
                                            <span className="text-purple-500 dark:text-purple-400 cursor-help text-xs w-3 h-3 rounded-full border border-current flex items-center justify-center text-[8px]">i</span>
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                                Total tokens used (In: {totalInputTokens.toLocaleString()}, Out: {totalOutputTokens.toLocaleString()})
                                            </div>
                                        </div>
                                        : <span className="text-blue-600 dark:text-blue-400">{totalTokens.toLocaleString()}</span>
                                    </span>
                                </div>
                                <div className="flex gap-1">
                                    {isPromptLocked && (
                                        <button
                                            onClick={() => {
                                                setIsStreaming(false)
                                                setIsWaitingForStream(false)
                                                setStreamingMessageId(null)
                                                setLastStreamingContent('')
                                                setStreamingContentCheckCount(0)
                                                setLastMetadataStatus('None')
                                                isStreamingRef.current = false
                                            }}
                                            className="px-2 py-1 text-xs bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200 rounded hover:bg-red-300 dark:hover:bg-red-700"
                                        >
                                            Reset
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {isLoadingMessages ? (
                    <div className="flex items-center justify-center min-h-full pt-32">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <div className="w-3 h-3 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs">Loading messages...</span>
                        </div>
                    </div>
                ) : hasMessages ? (
                    <div className="px-6 py-6 space-y-2">
                        {/* Debug: Messages count: {messages.length}, hasMessages: {hasMessages.toString()} */}
                        {messages.map((m, index) => (
                            <div 
                                key={m.id} 
                                className="space-y-1"
                                style={{ opacity: 1, visibility: 'visible' }}
                            >
                                <div className={m.role === 'assistant' ? 'flex gap-2 items-start' : 'flex justify-end'}>
                                    {m.role === 'assistant' && (
                                        <div className="mt-0.5 text-muted-foreground">
                                            <Brain className="h-4 w-4" />
                                        </div>
                                    )}
                                    <div
                                        className={
                                            m.role === 'assistant'
                                                ? 'rounded-md bg-accent px-2.5 py-1.5 text-xs max-w-[220px]'
                                                : 'rounded-md bg-primary text-primary-foreground px-2.5 py-1.5 text-xs max-w-[220px]'
                                        }
                                    >
                                        {/* Debug: Role: {m.role}, Content: {m.content.substring(0, 50)}... */}
                                        {m.role === 'assistant' ? (
                                            <AIMessageRenderer content={m.content} />
                                        ) : (
                                            m.content
                                        )}
                                        {/* Show streaming indicator for assistant messages */}
                                        {m.role === 'assistant' && m.metadata?.streaming && m.metadata?.status === 'generating' && (
                                            <div className="flex items-center gap-1 mt-1">
                                                <span className="text-xs text-muted-foreground">
                                                    {isWaitingForStream ? 'Waiting for stream...' : 
                                                     'Writing'}
                                                </span>
                                                <div className="flex gap-0.5">
                                                    <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                                                    <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                                                    <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                                                </div>
                                            </div>
                                        )}
                                        {/* Show completion indicator */}
                                        {m.role === 'assistant' && m.metadata?.status === 'completed' && (
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {m.generationTimeMs ? formatDuration(m.generationTimeMs) : '✓ Generated'}
                                                {m.tokenCount ? ` • ${m.tokenCount} tokens` : ''}
                                            </div>
                                        )}
                                        {/* Show error indicator */}
                                        {m.role === 'assistant' && m.metadata?.status === 'error' && (
                                            <div className="text-xs text-destructive mt-1">
                                                ⚠ Generation failed
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Debug Mode: Show revision ID for each message */}
                                {showDebugPanel && m.revisionId && (
                                    <div className={`mt-1 ${m.role === 'assistant' ? 'ml-6' : 'flex justify-end'}`}>
                                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50/90 dark:bg-purple-950/50 backdrop-blur-sm rounded-md text-xs">
                                            <span className="text-purple-700 dark:text-purple-300 font-medium">Revision:</span>
                                            <span className="text-purple-600 dark:text-purple-400 font-mono">
                                                {m.revisionId}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Show change indicators for assistant messages */}
                                {m.role === 'assistant' && (
                                    <AIChangeIndicators 
                                        content={m.content} 
                                        isStreaming={m.metadata?.streaming && m.metadata?.status === 'generating'} 
                                    />
                                )}
                                
                                {/* Debug Mode: Purple button to view raw message */}
                                {debugMode && (
                                    <div className={`mt-1 ${m.role === 'assistant' ? 'ml-6' : 'flex justify-end'}`}>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-purple-600 bg-purple-50/90 hover:bg-purple-100/90 dark:text-purple-400 dark:bg-purple-950/50 dark:hover:bg-purple-900/50 backdrop-blur-sm text-xs"
                                            onClick={() => handleViewRawMessage(m)}
                                            title="View raw message data"
                                        >
                                            <Code className="h-3 w-3 mr-1" />
                                            Raw
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                        
                        {/* Show loading indicator when waiting for AI response */}
                        {isWaitingForStream && (
                            <div className="space-y-1 animate-in fade-in-0 duration-300">
                                <div className="flex gap-2 items-start">
                                    <div className="mt-0.5 text-muted-foreground">
                                        <Brain className="h-4 w-4" />
                                    </div>
                                    <div className="rounded-md bg-accent px-2.5 py-1.5 text-xs max-w-[220px]">
                                        <div className="flex items-center gap-2">
                                            <div className="flex gap-0.5">
                                                <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                                                <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                                                <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                                            </div>
                                            <span className="text-xs text-muted-foreground">Thinking...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div ref={bottomRef} />
                        
                        {/* Debug Mode: Mock Message Buttons */}
                        {debugMode && (
                            <div className="sticky top-0 z-10 p-4 mb-4 bg-purple-50/90 dark:bg-purple-950/50 backdrop-blur-sm rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                                        Debug
                                        <span className="ml-2 text-xs font-normal text-purple-600 dark:text-purple-300">
                                            Mock Messages
                                        </span>
                                    </h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div>
                                        <div className="font-medium text-purple-700 dark:text-purple-300 mb-2">User Messages</div>
                                        <div className="space-y-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-6 px-2 text-xs text-purple-600 border-purple-300 hover:bg-purple-200 dark:text-purple-400 dark:border-purple-700 dark:hover:bg-purple-800"
                                                onClick={() => addMockUserMessage()}
                                            >
                                                User Message
                                            </Button>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="font-medium text-purple-700 dark:text-purple-300 mb-2">Assistant Messages</div>
                                        <div className="space-y-1">
                                            <div className="flex flex-wrap gap-1">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-6 px-2 text-xs text-purple-600 border-purple-300 hover:bg-purple-200 dark:text-purple-400 dark:border-purple-700 dark:hover:bg-purple-800"
                                                    onClick={() => addMockAssistantMessage()}
                                                >
                                                    Text
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-6 px-2 text-xs text-purple-600 border-purple-300 hover:bg-purple-200 dark:text-purple-400 dark:border-purple-700 dark:hover:bg-purple-800"
                                                    onClick={() => addMockAssistantWithChanges()}
                                                >
                                                    + Changes
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-6 px-2 text-xs text-purple-600 border-purple-300 hover:bg-purple-200 dark:text-purple-400 dark:border-purple-700 dark:hover:bg-purple-800"
                                                    onClick={() => addMockLongMessage()}
                                                >
                                                    Long
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 pt-2 border-t border-purple-200 dark:border-purple-700">
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="font-medium text-purple-700 dark:text-purple-300 mb-2">Special States</div>
                                        <div className="flex flex-wrap gap-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-6 px-2 text-xs text-purple-600 border-purple-300 hover:bg-purple-200 dark:text-purple-400 dark:border-purple-700 dark:hover:bg-purple-800"
                                                onClick={() => addMockStreamingMessage()}
                                            >
                                                Streaming
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-6 px-2 text-xs text-purple-600 border-purple-300 hover:bg-purple-200 dark:text-purple-400 dark:border-purple-700 dark:hover:bg-purple-800"
                                                onClick={() => addMockWaitingForStream()}
                                            >
                                                Waiting
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-6 px-2 text-xs text-purple-600 border-purple-300 hover:bg-purple-200 dark:text-purple-400 dark:border-purple-700 dark:hover:bg-purple-800"
                                                onClick={() => addMockProcessingJSON()}
                                            >
                                                JSON
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-6 px-2 text-xs text-purple-600 border-purple-300 hover:bg-purple-200 dark:text-purple-400 dark:border-purple-700 dark:hover:bg-purple-800"
                                                onClick={() => addMockErrorMessage()}
                                            >
                                                Error
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : shouldShowPlaceholder ? (
                    <div className="flex items-center justify-center min-h-full">
                        <ConversationPlaceholder onSendMessage={(message) => {
                            // Send the message directly using the send function
                            send(message)
                        }} />
                    </div>
                ) : null}
            </ScrollArea>

            <div className="relative px-6 py-6 space-y-2 bg-background border-t border-foreground/30">
                {/* Gradient fade overlay - more gradual */}
                <div className="absolute inset-x-0 -top-8 h-12 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
                <div className="flex flex-wrap gap-1.5">
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        className="gap-1 h-6 px-2 text-[10px]" 
                        onClick={applySEOTitle}
                        disabled={isPromptLocked}
                    >
                        <Sparkles className="h-3 w-3" /> Optimize SEO title
                    </Button>
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        className="gap-1 h-6 px-2 text-[10px]" 
                        onClick={generateMetaDescription}
                        disabled={isPromptLocked}
                    >
                        <Sparkles className="h-3 w-3" /> Generate meta description
                    </Button>
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        className="gap-1 h-6 px-2 text-[10px]" 
                        onClick={() => send("Improve this title")}
                        disabled={isPromptLocked}
                    >
                        <Sparkles className="h-3 w-3" /> Improve title
                    </Button>
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        className="gap-1 h-6 px-2 text-[10px]" 
                        onClick={() => send("Write a better introduction")}
                        disabled={isPromptLocked}
                    >
                        <Sparkles className="h-3 w-3" /> Better intro
                    </Button>
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        className="gap-1 h-6 px-2 text-[10px]" 
                        onClick={() => send("Add more sections to structure this content")}
                        disabled={isPromptLocked}
                    >
                        <Sparkles className="h-3 w-3" /> Add sections
                    </Button>
                </div>
                <div className="relative">
                    <Textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => {
                            if (!isPromptLocked) {
                                setInput(e.target.value)
                            }
                        }}
                        placeholder={
                            isWaitingForStream 
                                ? "Thinking" 
                                : isStreaming 
                                    ? "AI is responding..." 
                                    : "Ask the agent…"
                        }
                        className={`min-h-[44px] max-h-32 pr-12 text-sm resize-none ${isPromptLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isPromptLocked}
                        onKeyDown={(e) => {
                            // Block all input when prompt is locked
                            if (isPromptLocked) {
                                e.preventDefault()
                                return
                            }
                            
                            // Submit on Cmd+Enter (Mac) or Ctrl+Enter (Windows)
                            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                                e.preventDefault()
                                send()
                            }
                        }}
                        onKeyPress={(e) => {
                            // Block all key presses when prompt is locked
                            if (isPromptLocked) {
                                e.preventDefault()
                            }
                        }}
                        onPaste={(e) => {
                            // Block paste when prompt is locked
                            if (isPromptLocked) {
                                e.preventDefault()
                            }
                        }}
                    />
                    <Button 
                        size="sm" 
                        className="absolute bottom-1.5 right-1.5 h-6 w-6 p-0" 
                        onClick={() => send()}
                        disabled={isPromptLocked || !input.trim()}
                    >
                        <CornerDownLeft className="h-3 w-3" />
                    </Button>
                </div>
                {typeof navigator !== 'undefined' && navigator.maxTouchPoints === 0 && (
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <div className="flex items-center space-x-0.5">
                            <div className="inline-flex items-center justify-center w-3 h-3 text-[8px] font-medium bg-muted rounded border">
                                {/Mac|iPod|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl'}
                            </div>
                            <span>+ {/Mac|iPod|iPhone|iPad/.test(navigator.platform) ? 'Return' : 'Enter'} to submit</span>
                        </div>
                    </div>
                )}
            </div>
        </>
    )

    if (isMobile) {
        return (
            <>
                {/* Floating chat button - positioned above footer */}
                <Button
                    onClick={() => setIsDrawerOpen(true)}
                    className="fixed bottom-20 left-6 z-50 h-14 w-14 rounded-full shadow-lg"
                    size="icon"
                >
                    <MessageCircle className="h-6 w-6" />
                </Button>

                {/* Mobile drawer */}
                <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                    <DrawerContent className="h-[80vh]">
                        <DrawerHeader>
                            <DrawerTitle className="flex items-center gap-2">
                                <Brain className="h-4 w-4" />
                                AI Co-writer
                            </DrawerTitle>
                        </DrawerHeader>
                        <div className="flex flex-col h-full">
                            {chatContent}
                        </div>
                    </DrawerContent>
                </Drawer>
            </>
        )
    }

    return (
        <aside
            className="fixed left-0 z-10 flex w-72 md:w-[18rem] lg:w-[20rem] xl:w-[24rem] flex-col border-r bg-background"
            style={{ top: topOffset, bottom: 0 }}
        >
            <header className="h-12 px-6 border-b flex items-center">
                <ConversationSelector
                    conversations={conversations}
                    currentConversationId={currentConversationId}
                    onSelectConversation={setCurrentConversationId}
                    onCreateNewConversation={async () => {
                        const newConversation = await createConversation({
                            title: `Conversation ${conversations.length + 1}`,
                            blogId,
                        })
                        setCurrentConversationId(newConversation.$id)
                    }}
                    onEditConversation={handleEditConversation}
                    onDeleteConversation={handleDeleteConversation}
                    isLoading={isLoadingConversations || isCreatingMessage || isDeletingConversation}
                />
            </header>
            {chatContent}
            
            {/* Raw Message Modal */}
            <Dialog open={rawMessageModalOpen} onOpenChange={setRawMessageModalOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Code className="h-4 w-4" />
                            Raw Message Data
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col h-full overflow-hidden">
                        {selectedMessageForRaw && (
                            <div className="space-y-4 flex-1 overflow-hidden">
                                {/* Message Info */}
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium text-muted-foreground">Role:</span>
                                        <span className="ml-2 font-mono">{selectedMessageForRaw.role}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-muted-foreground">ID:</span>
                                        <span className="ml-2 font-mono text-xs">{selectedMessageForRaw.id}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-muted-foreground">Created:</span>
                                        <span className="ml-2">{new Date(selectedMessageForRaw.createdAt).toLocaleString()}</span>
                                    </div>
                                    {selectedMessageForRaw.revisionId && (
                                        <div>
                                            <span className="font-medium text-muted-foreground">Revision ID:</span>
                                            <span className="ml-2 font-mono text-xs">{selectedMessageForRaw.revisionId}</span>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Content */}
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm">Content:</h4>
                                    <ScrollArea className="h-32 border rounded-md p-3 bg-muted/50">
                                        <pre className="text-xs whitespace-pre-wrap font-mono">
                                            {selectedMessageForRaw.content}
                                        </pre>
                                    </ScrollArea>
                                </div>
                                
                                {/* Metadata */}
                                {selectedMessageForRaw.metadata && (
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm">Metadata:</h4>
                                        <ScrollArea className="h-32 border rounded-md p-3 bg-muted/50">
                                            <pre className="text-xs whitespace-pre-wrap font-mono">
                                                {JSON.stringify(selectedMessageForRaw.metadata, null, 2)}
                                            </pre>
                                        </ScrollArea>
                                    </div>
                                )}
                                
                                {/* Token Info */}
                                {(selectedMessageForRaw.tokenCount || selectedMessageForRaw.generationTimeMs) && (
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm">Performance:</h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            {selectedMessageForRaw.tokenCount && (
                                                <div>
                                                    <span className="font-medium text-muted-foreground">Tokens:</span>
                                                    <span className="ml-2">{selectedMessageForRaw.tokenCount}</span>
                                                </div>
                                            )}
                                            {selectedMessageForRaw.generationTimeMs && (
                                                <div>
                                                    <span className="font-medium text-muted-foreground">Generation Time:</span>
                                                    <span className="ml-2">{formatDuration(selectedMessageForRaw.generationTimeMs)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </aside>
    )
}


function makeSEOTitle(t: string) {
    const base = (t || 'From idea to article with your AI co-writer').trim()
    const seoStarters = ['Complete Guide to', 'How to', 'Best Practices for', 'Ultimate Guide to', 'Everything You Need to Know About']
    const s = seoStarters[Math.floor(Math.random() * seoStarters.length)]
    if (/^(complete guide|how to|best practices|ultimate guide|everything you need)/i.test(base)) return base
    return `${s} ${base.charAt(0).toLowerCase()}${base.slice(1)}`
}

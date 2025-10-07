import { useEffect, useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { Brain, Sparkles, Send, MessageCircle } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { useConversationManager, useMessagesWithNotifications } from '@/hooks/use-conversations'
import { ConversationSelector } from './conversation-selector'
import { ConversationPlaceholder } from './conversation-placeholder'
import { useAuth } from '@/hooks/use-auth'
import type { Messages } from '@/lib/appwrite/appwrite.types'
import { functionService } from '@/lib/appwrite/functions'
import { formatDuration } from '@/lib/date-utils'
import { client } from '@/lib/appwrite/db'

type Message = {
    id: string
    role: 'user' | 'assistant'
    content: string
    createdAt: string
    tokenCount?: number | null
    generationTimeMs?: number | null
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
}: {
    title: string
    subtitle: string
    onSetTitle: (t: string) => void
    onSetSubtitle: (s: string) => void
    articleId: string
    blogId?: string
}) {
    const { user } = useAuth()
    const [input, setInput] = useState('')
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [isWaitingForAI, setIsWaitingForAI] = useState(false)
    const [previousMessageCount, setPreviousMessageCount] = useState(0)
    const [previousAssistantCount, setPreviousAssistantCount] = useState(0)
    const [previousAssistantMessages, setPreviousAssistantMessages] = useState<Messages[]>([])
    const [isStreaming, setIsStreaming] = useState(false)
    const [isWaitingForStream, setIsWaitingForStream] = useState(false)
    const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
    const [debugEvents, setDebugEvents] = useState<string[]>([])
    const [lastStreamingContent, setLastStreamingContent] = useState<string>('')
    const [streamingContentCheckCount, setStreamingContentCheckCount] = useState(0)
    const [lastMetadataStatus, setLastMetadataStatus] = useState<string>('None')
    const [showDebugPanel, setShowDebugPanel] = useState<boolean>(false)
    const isMobile = useIsMobile()
    const inputRef = useRef<HTMLInputElement>(null)
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
    } = useConversationManager(articleId, user?.$id || '')

    const {
        messages: dbMessages,
        isLoadingMessages,
        createMessage,
        isCreatingMessage,
    } = useMessagesWithNotifications(currentConversationId, blogId, articleId, user?.$id)

    // Custom realtime event handler for streaming debug - stable subscription
    useEffect(() => {
        const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID
        const messagesChannel = `databases.${databaseId}.collections.messages.documents`
        
        const unsubscribe = client.subscribe(messagesChannel, (response) => {
            const { payload, events } = response
            
            // Type guard for payload
            if (!payload || typeof payload !== 'object' || !('conversationId' in payload)) return
            
            const messagePayload = payload as any
            
            // Only process events for the current conversation
            if (!currentConversationIdRef.current || messagePayload.conversationId !== currentConversationIdRef.current) return
            
            const isCreateEvent = events.some(event => event.includes('.create'))
            const isUpdateEvent = events.some(event => event.includes('.update'))
            
            
            if (isCreateEvent && messagePayload.role === 'assistant') {
                // Streaming started - new assistant message created
                console.log('🤖 Assistant message created via realtime:', messagePayload.$id)
                setIsWaitingForStream(false)
                setIsStreaming(true)
                setStreamingMessageId(messagePayload.$id)
                
                // Update metadata status for create event too
                const metadata = messagePayload.metadata ? JSON.parse(messagePayload.metadata) : undefined
                if (metadata) {
                    const statusText = metadata.status || 'unknown'
                    const streamingText = metadata.streaming ? 'streaming' : 'not-streaming'
                    setLastMetadataStatus(`${statusText} (${streamingText})`)
                }
                
                setDebugEvents(prev => [...prev.slice(-4), `Streaming started: ${messagePayload.$id} at ${new Date().toISOString()}`])
            } else if (isUpdateEvent && messagePayload.role === 'assistant') {
                // Check if this is the streaming message we're tracking
                const isStreamingMessage = messagePayload.$id === streamingMessageId
                const metadata = messagePayload.metadata ? JSON.parse(messagePayload.metadata) : undefined
                const currentContent = messagePayload.content || ''
                
                // Update last metadata status for debug
                if (metadata) {
                    const statusText = metadata.status || 'unknown'
                    const streamingText = metadata.streaming ? 'streaming' : 'not-streaming'
                    setLastMetadataStatus(`${statusText} (${streamingText})`)
                }
                
                
                // If this is our streaming message, check for completion
                if (isStreamingMessage) {
                    // Check if content has changed (still streaming)
                    if (currentContent !== lastStreamingContent) {
                        setLastStreamingContent(currentContent)
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
                        setDebugEvents(prev => [...prev.slice(-4), `Streaming completed: ${messagePayload.$id} at ${new Date().toISOString()}`])
                    }
                }
                
                // Also check if any assistant message has completed status (fallback)
                if (metadata?.status === 'completed' && isStreamingRef.current) {
                    setIsStreaming(false)
                    setIsWaitingForStream(false)
                    setStreamingMessageId(null)
                    setLastStreamingContent('')
                    setStreamingContentCheckCount(0)
                    setDebugEvents(prev => [...prev.slice(-4), `Streaming completed via fallback: ${messagePayload.$id} at ${new Date().toISOString()}`])
                }
            }
            
            // Always update metadata status for any assistant message event (fallback)
            if (messagePayload.role === 'assistant' && messagePayload.metadata) {
                try {
                    const metadata = JSON.parse(messagePayload.metadata)
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
                        setDebugEvents(prev => [...prev.slice(-4), `Streaming completed via metadata fallback: ${messagePayload.$id} at ${new Date().toISOString()}`])
                    }
                } catch (error) {
                    setLastMetadataStatus('parse-error')
                }
            }
        })

        return () => {
            unsubscribe()
        }
    }, []) // Remove currentConversationId and streamingMessageId from dependencies to avoid reconnection

    // Convert database messages to local format and sort with oldest at top
    const dbMessagesFormatted: Message[] = dbMessages
        .map((msg: Messages) => ({
            id: msg.$id,
            role: msg.role,
            content: msg.content,
            createdAt: msg.$createdAt,
            tokenCount: msg.tokenCount,
            generationTimeMs: msg.generationTimeMs,
            metadata: msg.metadata ? JSON.parse(msg.metadata) : undefined,
        }))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) // Sort oldest to newest

    // Use database messages directly
    const messages: Message[] = dbMessagesFormatted


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

    // Show messages if they exist, otherwise show placeholder (only when not loading)
    const hasMessages = messages.length > 0
    const shouldShowPlaceholder = !isLoadingMessages && messages.length === 0
    

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
                    lastDbMessage.content !== 'Thinking...'
                
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
            }, 10000) // 10 second timeout

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
            }, 30000) // 30 second safety timeout

            return () => clearTimeout(safetyTimeout)
        }
    }, [isPromptLocked])

    // Keyboard shortcut to toggle debug panel (Cmd+. or Ctrl+.)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check for Cmd+. (Mac) or Ctrl+. (Windows/Linux)
            if (e.key === '.' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setShowDebugPanel(prev => !prev)
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [showDebugPanel])

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
            console.log('📝 Creating user message:', text.substring(0, 50))
            const userMessage = await createMessage({
                role: 'user',
                content: text,
                userId: user?.$id || '',
            })
            console.log('📝 User message created:', userMessage.$id)

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

    const chatContent = (
        <>
            <ScrollArea ref={scrollAreaRef} className="flex-1">
                {/* Debug panel - sticky to top (toggleable with Cmd+. or Ctrl+.) */}
                {showDebugPanel && (
                    <div className="sticky top-0 z-10 p-2 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-1 mb-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${isLoadingConversations ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                        <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">Debug</span>
                        <div className="ml-auto flex items-center gap-1">
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
                                    className="px-1 py-0.5 text-[9px] bg-red-500 text-white rounded hover:bg-red-600"
                                >
                                    Reset
                                </button>
                            )}
                            <div className="text-[9px] text-slate-500 dark:text-slate-400">
                                {new Date().toLocaleTimeString()}
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 text-[10px]">
                        <div>
                            <div className="text-slate-500 dark:text-slate-400 font-medium text-[9px]">Conversation</div>
                            <div className="text-slate-800 dark:text-slate-200 font-mono text-[10px]">
                                {conversations.find(c => c.$id === currentConversationId)?.title || 'None'}
                            </div>
                            <div className="text-slate-600 dark:text-slate-400 text-[9px] font-mono">
                                ID: {currentConversationId?.slice(-8) || 'None'}
                            </div>
                        </div>
                        <div>
                            <div className="text-slate-500 dark:text-slate-400 font-medium text-[9px]">Messages & Status</div>
                            <div className="text-slate-800 dark:text-slate-200 font-mono text-[10px]">
                                Messages: {messages.length}
                            </div>
                            <div className="text-slate-600 dark:text-slate-400 text-[9px] font-mono">
                                {isWaitingForStream ? '⏳ Waiting' : ''} {isStreaming ? '🔄 Streaming' : ''} {isPromptLocked ? '🔒 Locked' : '🔓 Unlocked'}
                            </div>
                            <div className="text-slate-500 dark:text-slate-400 text-[8px] font-mono">
                                Last: {lastMetadataStatus}
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
                        {messages.map((m) => (
                            <div key={m.id} className="space-y-1">
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
                                        {m.role === 'assistant' ? (
                                            <MarkdownRenderer content={m.content} />
                                        ) : (
                                            m.content
                                        )}
                                        {/* Show streaming indicator for assistant messages */}
                                        {m.role === 'assistant' && m.metadata?.streaming && m.metadata?.status === 'generating' && (
                                            <div className="flex items-center gap-1 mt-1">
                                                <span className="text-xs text-muted-foreground">
                                                    Generating
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
                                
                            </div>
                        ))}
                        
                        
                        <div ref={bottomRef} />
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
                <div className="flex gap-2">
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        className="gap-1 h-7 px-2 text-[11px]" 
                        onClick={applySEOTitle}
                        disabled={isPromptLocked}
                    >
                        <Sparkles className="h-3.5 w-3.5" /> SEO title
                    </Button>
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        className="gap-1 h-7 px-2 text-[11px]" 
                        onClick={generateMetaDescription}
                        disabled={isPromptLocked}
                    >
                        <Sparkles className="h-3.5 w-3.5" /> Meta description
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Input
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
                        className={`h-9 text-sm ${isPromptLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isPromptLocked}
                        onKeyDown={(e) => {
                            // Block all input when prompt is locked
                            if (isPromptLocked) {
                                e.preventDefault()
                                return
                            }
                            
                            // Only allow Enter to submit when not locked
                            if (e.key === 'Enter' && !e.shiftKey) {
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
                        className="h-9 px-3" 
                        onClick={() => send()}
                        disabled={isPromptLocked || !input.trim()}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
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
                    isLoading={isLoadingConversations || isCreatingMessage}
                />
            </header>
            {chatContent}
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

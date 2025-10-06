import { useEffect, useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { Brain, Sparkles, Send, MessageCircle } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { useConversationManager, useMessages, useMessagesWithNotifications } from '@/hooks/use-conversations'
import { ConversationSelector } from './conversation-selector'
import { ConversationPlaceholder } from './conversation-placeholder'
import { useAuth } from '@/hooks/use-auth'
import type { Messages } from '@/lib/appwrite/appwrite.types'
import { functionService } from '@/lib/appwrite/functions'
import { formatDuration } from '@/lib/date-utils'

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
    subtitle,
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
    const [mockMessage, setMockMessage] = useState<Message | null>(null)
    const isMobile = useIsMobile()
    const inputRef = useRef<HTMLInputElement>(null)

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
        getOrCreateFirstConversation,
    } = useConversationManager(articleId, user?.$id || '')

    const {
        messages: dbMessages,
        isLoadingMessages,
        isLoadingMoreMessages,
        hasMoreMessages,
        loadMoreMessages,
        createMessage,
        isCreatingMessage,
    } = useMessagesWithNotifications(currentConversationId, blogId, articleId, user?.$id)

    // Convert database messages to local format and sort with newest at bottom
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
        .reverse() // Reverse to show newest at bottom

    // Combine database messages with mock message if it exists
    const messages: Message[] = mockMessage 
        ? [...dbMessagesFormatted, mockMessage]
        : dbMessagesFormatted


    // Memoize the conversation creation function to prevent infinite loops
    const createInitialConversation = useCallback(async () => {
        if (conversations.length === 0 && !currentConversationId && !isLoadingConversations) {
            try {
                const newConversation = await createConversation({
                    title: 'New conversation',
                    blogId,
                })
                setCurrentConversationId(newConversation.$id)
            } catch (error) {
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

    // Show messages if they exist, otherwise show placeholder
    const hasMessages = messages.length > 0
    

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

    // Auto-scroll to newest message (but not when loading more messages)
    const bottomRef = useRef<HTMLDivElement | null>(null)
    const scrollAreaRef = useRef<HTMLDivElement | null>(null)
    const [previousMessageCount, setPreviousMessageCount] = useState(0)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [shouldPreserveScroll, setShouldPreserveScroll] = useState(false)
    const [lastScrollTime, setLastScrollTime] = useState(0)
    
    // Save scroll position when starting to load more messages
    const handleLoadMore = useCallback(() => {
        setShouldPreserveScroll(true)
        loadMoreMessages()
    }, [loadMoreMessages])
    
    useEffect(() => {
        // Only scroll if we're not loading more messages and the message count increased
        if (!isLoadingMore && messages.length > previousMessageCount && !shouldPreserveScroll) {
            const now = Date.now()
            // Prevent rapid scrolling by ensuring at least 50ms between scrolls
            if (now - lastScrollTime > 50) {
                // Use a small delay to ensure the DOM has updated
                setTimeout(() => {
                    scrollToBottom()
                    setLastScrollTime(Date.now())
                }, 10)
            }
        }
        setPreviousMessageCount(messages.length)
    }, [messages.length, isLoadingMore, shouldPreserveScroll, scrollToBottom, lastScrollTime])

    // Additional scroll trigger for any message changes (more reliable)
    useEffect(() => {
        if (!isLoadingMore && !shouldPreserveScroll && dbMessages.length > 0) {
            const now = Date.now()
            // Only scroll if we haven't scrolled recently (prevent rapid scrolling)
            if (now - lastScrollTime > 100) {
                setTimeout(() => {
                    scrollToBottom()
                    setLastScrollTime(Date.now())
                }, 10)
            }
        }
    }, [dbMessages, isLoadingMore, shouldPreserveScroll, scrollToBottom, lastScrollTime])

    // Special scroll effect for streaming messages - scroll more frequently during streaming
    useEffect(() => {
        if (!isLoadingMore && !shouldPreserveScroll && dbMessages.length > 0) {
            const lastMessage = dbMessages[dbMessages.length - 1]
            const metadata = lastMessage.metadata ? JSON.parse(lastMessage.metadata) : undefined
            if (lastMessage.role === 'assistant' && metadata?.streaming && metadata?.status === 'generating') {
                // Scroll more frequently during streaming
                const now = Date.now()
                if (now - lastScrollTime > 50) { // More frequent scrolling for streaming
                    setTimeout(() => {
                        scrollToBottom()
                        setLastScrollTime(Date.now())
                    }, 10)
                }
            }
        }
    }, [dbMessages, isLoadingMore, shouldPreserveScroll, scrollToBottom, lastScrollTime])
    
    // Track when we're loading more messages
    useEffect(() => {
        if (isLoadingMoreMessages) {
            setIsLoadingMore(true)
        } else {
            // Reset states after loading completes
            const timer = setTimeout(() => {
                setIsLoadingMore(false)
                setShouldPreserveScroll(false)
            }, 100)
            return () => clearTimeout(timer)
        }
    }, [isLoadingMoreMessages])

    // Clear AI waiting state when a new assistant message arrives and starts streaming
    useEffect(() => {
        if (isWaitingForAI && dbMessages.length > 0) {
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
                    // Clear mock message when real message arrives
                    setMockMessage(null)
                    // Scroll to the new assistant message
                    setTimeout(() => {
                        scrollToBottom()
                        setLastScrollTime(Date.now())
                    }, 10) // Minimal delay for immediate scrolling
                }
            }
        }
    }, [dbMessages, isWaitingForAI, scrollToBottom])

    // Focus input when AI message completes streaming
    useEffect(() => {
        if (dbMessages.length > 0) {
            const lastMessage = dbMessages[dbMessages.length - 1]
            if (lastMessage.role === 'assistant') {
                const metadata = lastMessage.metadata ? JSON.parse(lastMessage.metadata) : undefined
                // Check if streaming is complete
                const isStreamingComplete = !metadata?.streaming || 
                    metadata?.status === 'completed' || 
                    metadata?.status === 'error'
                
                if (isStreamingComplete) {
                    // Focus the input after a short delay to ensure smooth transition
                    setTimeout(() => {
                        if (inputRef.current) {
                            inputRef.current.focus()
                        }
                    }, 100)
                }
            }
        }
    }, [dbMessages])

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
                setMockMessage(null)
            }, 10000) // 10 second timeout

            return () => clearTimeout(timeout)
        }
    }, [isWaitingForAI])

    // Global keyboard lock when AI is thinking
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (isWaitingForAI) {
                // Block Enter key globally when AI is thinking
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    e.stopPropagation()
                }
            }
        }

        if (isWaitingForAI) {
            document.addEventListener('keydown', handleGlobalKeyDown, true)
            return () => {
                document.removeEventListener('keydown', handleGlobalKeyDown, true)
            }
        }
    }, [isWaitingForAI])

    const send = async () => {
        const text = input.trim()
        if (!text || !currentConversationId) return

        // Clear input and show loading immediately for better UX
        setInput('')
        setIsWaitingForAI(true)

        // Create mock message immediately for better UX
        const mockMsg: Message = {
            id: 'mock-message',
            role: 'assistant',
            content: 'Thinking... 123456',
            createdAt: new Date().toISOString(),
            metadata: {
                streaming: true,
                status: 'generating',
                isMock: true
            }
        }
        setMockMessage(mockMsg)

        try {
            // Create user message in background
            createMessage({
                role: 'user',
                content: text,
                userId: user?.$id || '',
            }).catch(error => {
                // Reset states if message creation fails
                setIsWaitingForAI(false)
                setMockMessage(null)
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
                metadata: {
                    articleTitle: title,
                    userMessage: text
                }
            })
        } catch (error) {
            // Failed to send message
            setIsWaitingForAI(false)
            setMockMessage(null)
        }
    }

    const applySEOTitle = async () => {
        const next = makeSEOTitle(title)
        onSetTitle(next)
        
        if (!currentConversationId) return

        try {
            await createMessage({
                role: 'assistant',
                content: `Updated title to: "${next}"`,
                userId: user?.$id || '',
            })
            
            // Scroll to show the new message
            setTimeout(() => {
                scrollToBottom()
                setLastScrollTime(Date.now())
            }, 10)
        } catch (error) {
            // Failed to create message
        }
    }

    const generateMetaDescription = async () => {
        const base = title || 'this article'
        const next = `Learn about ${base.toLowerCase()} with practical insights, best practices, and actionable tips. Discover how to implement and optimize for better results.`
        onSetSubtitle(next)
        
        if (!currentConversationId) return

        try {
            await createMessage({
                role: 'assistant',
                content: 'Drafted a new meta description. Feel free to tweak it.',
                userId: user?.$id || '',
            })
            
            // Scroll to show the new message
            setTimeout(() => {
                scrollToBottom()
                setLastScrollTime(Date.now())
            }, 10)
        } catch (error) {
            // Failed to create message
        }
    }

    const chatContent = (
        <>
            <ScrollArea ref={scrollAreaRef} className="flex-1">
                {hasMessages ? (
                    <div className="px-6 py-6 space-y-2">
                        {/* Load More Button */}
                        {hasMoreMessages && (
                            <div className="flex justify-center py-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleLoadMore}
                                    disabled={isLoadingMoreMessages}
                                    className="text-xs"
                                >
                                    {isLoadingMoreMessages ? 'Loading...' : 'Load More Messages'}
                                </Button>
                            </div>
                        )}
                        
                        {messages.map((m) => (
                            <div key={`${m.id}-${m.metadata?.isMock ? 'mock' : 'real'}`} className="space-y-1">
                                <div className={m.role === 'assistant' ? 'flex gap-2 items-start' : 'flex justify-end'}>
                                    {m.role === 'assistant' && (
                                        <div className="mt-0.5 text-muted-foreground">
                                            <Brain className="h-4 w-4" />
                                        </div>
                                    )}
                                    <div
                                        className={
                                            m.role === 'assistant'
                                                ? m.metadata?.isMock
                                                    ? 'rounded-md bg-red-100 dark:bg-red-900/20 px-2.5 py-1.5 text-xs max-w-[220px]'
                                                    : 'rounded-md bg-accent px-2.5 py-1.5 text-xs max-w-[220px]'
                                                : 'rounded-md bg-primary text-primary-foreground px-2.5 py-1.5 text-xs max-w-[220px]'
                                        }
                                    >
                                        {m.role === 'assistant' ? (
                                            m.metadata?.isMock ? (
                                                <span className="text-red-600 dark:text-red-400 font-mono">{m.content}</span>
                                            ) : (
                                                <MarkdownRenderer content={m.content} />
                                            )
                                        ) : (
                                            m.content
                                        )}
                                        {/* Show streaming indicator for assistant messages */}
                                        {m.role === 'assistant' && m.metadata?.streaming && m.metadata?.status === 'generating' && (
                                            <div className="flex items-center gap-1 mt-1">
                                                <span className="text-xs text-muted-foreground">
                                                    {m.metadata?.isMock ? 'Thinking' : 'Generating'}
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
                ) : (
                    <div className="flex items-center justify-center min-h-full">
                        <ConversationPlaceholder onSendMessage={async (message) => {
                            if (!currentConversationId) return
                            
                            try {
                                // Create user message
                                await createMessage({
                                    role: 'user',
                                    content: message,
                                    userId: user?.$id || '',
                                })

                                // Scroll to show user message
                                setTimeout(() => {
                                    scrollToBottom()
                                    setLastScrollTime(Date.now())
                                }, 10)

                                // Create assistant reply
                                const reply = mockReply(message, title)
                                await createMessage({
                                    role: 'assistant',
                                    content: reply,
                                    userId: user?.$id || '',
                                })

                                // Scroll to show assistant reply
                                setTimeout(() => {
                                    scrollToBottom()
                                    setLastScrollTime(Date.now())
                                }, 10)
                            } catch (error) {
                                // Failed to send message
                            }
                        }} />
                    </div>
                )}
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
                        disabled={isWaitingForAI}
                    >
                        <Sparkles className="h-3.5 w-3.5" /> SEO title
                    </Button>
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        className="gap-1 h-7 px-2 text-[11px]" 
                        onClick={generateMetaDescription}
                        disabled={isWaitingForAI}
                    >
                        <Sparkles className="h-3.5 w-3.5" /> Meta description
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => {
                            if (!isWaitingForAI) {
                                setInput(e.target.value)
                            }
                        }}
                        placeholder={isWaitingForAI ? "AI is thinking..." : "Ask the agent…"}
                        className={`h-9 text-sm ${isWaitingForAI ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isWaitingForAI}
                        onKeyDown={(e) => {
                            // Block all input when AI is thinking
                            if (isWaitingForAI) {
                                e.preventDefault()
                                return
                            }
                            
                            // Only allow Enter to submit when not waiting
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                send()
                            }
                        }}
                        onKeyPress={(e) => {
                            // Block all key presses when AI is thinking
                            if (isWaitingForAI) {
                                e.preventDefault()
                            }
                        }}
                        onPaste={(e) => {
                            // Block paste when AI is thinking
                            if (isWaitingForAI) {
                                e.preventDefault()
                            }
                        }}
                    />
                    <Button 
                        size="sm" 
                        className="h-9 px-3" 
                        onClick={send}
                        disabled={isWaitingForAI || !input.trim()}
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

function mockReply(input: string, currentTitle: string) {
    const q = input.toLowerCase()
    if (q.includes('title')) {
        return `Try: "${makeSEOTitle(currentTitle)}"`
    }
    if (q.includes('subtitle') || q.includes('summary') || q.includes('meta')) {
        return 'I can draft a compelling meta description that improves search visibility and click-through rates.'
    }
    return "Got it. I can help optimize your content for SEO, generate outlines, or polish your tone."
}

function makeSEOTitle(t: string) {
    const base = (t || 'From idea to article with your AI co-writer').trim()
    const seoStarters = ['Complete Guide to', 'How to', 'Best Practices for', 'Ultimate Guide to', 'Everything You Need to Know About']
    const s = seoStarters[Math.floor(Math.random() * seoStarters.length)]
    if (/^(complete guide|how to|best practices|ultimate guide|everything you need)/i.test(base)) return base
    return `${s} ${base.charAt(0).toLowerCase()}${base.slice(1)}`
}

import { useEffect, useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Brain, Sparkles, Send, MessageCircle } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { useConversationManager, useMessages, useMessagesWithNotifications } from '@/hooks/use-conversations'
import { ConversationSelector } from './conversation-selector'
import { ConversationPlaceholder } from './conversation-placeholder'
import { useAuth } from '@/hooks/use-auth'
import type { Messages } from '@/lib/appwrite/appwrite.types'
import { functionService } from '@/lib/appwrite/functions'

type Message = {
    id: string
    role: 'user' | 'assistant'
    content: string
    createdAt: string
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
    const isMobile = useIsMobile()

    // Scroll to bottom function
    const scrollToBottom = useCallback(() => {
        if (scrollAreaRef.current) {
            const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
            if (scrollElement) {
                console.log('Scrolling to bottom, scrollHeight:', scrollElement.scrollHeight)
                scrollElement.scrollTo({
                    top: scrollElement.scrollHeight,
                    behavior: 'smooth'
                })
            } else {
                console.warn('ScrollArea viewport not found')
            }
        } else {
            console.warn('ScrollArea ref not found')
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
    const messages: Message[] = dbMessages
        .map((msg: Messages) => ({
            id: msg.$id,
            role: msg.role,
            content: msg.content,
            createdAt: msg.$createdAt,
        }))
        .reverse() // Reverse to show newest at bottom

    // Debug messages updates
    console.log('AgentChat messages updated:', {
        conversationId: currentConversationId,
        dbMessagesLength: dbMessages.length,
        messagesLength: messages.length,
        messages: messages.map(m => ({ id: m.id, role: m.role, content: m.content.substring(0, 50) + '...' }))
    })

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
                console.error('Failed to create initial conversation:', error)
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
        if (!isLoadingMore && !shouldPreserveScroll && messages.length > 0) {
            const now = Date.now()
            // Only scroll if we haven't scrolled recently (prevent rapid scrolling)
            if (now - lastScrollTime > 100) {
                setTimeout(() => {
                    scrollToBottom()
                    setLastScrollTime(Date.now())
                }, 10)
            }
        }
    }, [messages, isLoadingMore, shouldPreserveScroll, scrollToBottom, lastScrollTime])
    
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

    // Clear AI waiting state when a new assistant message arrives
    useEffect(() => {
        if (isWaitingForAI && messages.length > 0) {
            const lastMessage = messages[messages.length - 1]
            if (lastMessage.role === 'assistant') {
                setIsWaitingForAI(false)
                // Scroll to the new assistant message
                setTimeout(() => {
                    scrollToBottom()
                    setLastScrollTime(Date.now())
                }, 10) // Minimal delay for immediate scrolling
            }
        }
    }, [messages, isWaitingForAI, scrollToBottom])

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
                console.warn('AI response timeout - clearing loading state')
                setIsWaitingForAI(false)
            }, 10000) // 10 second timeout

            return () => clearTimeout(timeout)
        }
    }, [isWaitingForAI])

    const send = async () => {
        const text = input.trim()
        if (!text || !currentConversationId) return

        try {
            // Create user message
            await createMessage({
                role: 'user',
                content: text,
                userId: user?.$id || '',
            })

            setInput('')
            setIsWaitingForAI(true)

            // Scroll immediately after user message is created
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
            console.log('Agent function triggered successfully')
        } catch (error) {
            console.error('Failed to send message:', error)
            setIsWaitingForAI(false)
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
            console.error('Failed to create message:', error)
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
            console.error('Failed to create message:', error)
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
                                        {m.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {/* AI Loading Indicator */}
                        {isWaitingForAI && (
                            <div className="space-y-1">
                                <div className="flex gap-2 items-start">
                                    <div className="mt-0.5 text-muted-foreground">
                                        <Brain className="h-4 w-4" />
                                    </div>
                                    <div className="rounded-md bg-accent px-2.5 py-1.5 text-xs max-w-[220px]">
                                        <div className="flex items-center gap-1">
                                            <span>Thinking</span>
                                            <div className="flex gap-0.5">
                                                <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                                                <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                                                <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
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
                                console.error('Failed to send message:', error)
                            }
                        }} />
                    </div>
                )}
            </ScrollArea>

            <div className="relative px-6 py-6 space-y-2 bg-background">
                {/* Gradient fade overlay - more gradual */}
                <div className="absolute inset-x-0 -top-12 h-12 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" className="gap-1 h-7 px-2 text-[11px]" onClick={applySEOTitle}>
                        <Sparkles className="h-3.5 w-3.5" /> SEO title
                    </Button>
                    <Button variant="secondary" size="sm" className="gap-1 h-7 px-2 text-[11px]" onClick={generateMetaDescription}>
                        <Sparkles className="h-3.5 w-3.5" /> Meta description
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask the agent…"
                        className="h-9 text-sm"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                send()
                            }
                        }}
                    />
                    <Button size="sm" className="h-9 px-3" onClick={send}>
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

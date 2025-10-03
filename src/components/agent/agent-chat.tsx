import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Brain, Sparkles, Send, MessageCircle } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'

type Message = {
    id: string
    role: 'user' | 'assistant'
    content: string
}

export function AgentChat({
    title,
    subtitle,
    onSetTitle,
    onSetSubtitle,
}: {
    title: string
    subtitle: string
    onSetTitle: (t: string) => void
    onSetSubtitle: (s: string) => void
}) {
    const [input, setInput] = useState('')
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'm1',
            role: 'assistant',
            content: "Hi! I'm your AI co-writer. I can help punch up your title, draft a subtitle, or suggest section ideas.",
        },
        {
            id: 'm2',
            role: 'assistant',
            content: 'Try one of the quick actions below or ask me to rewrite the intro.',
        },
    ])
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const isMobile = useIsMobile()

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
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, [messages.length])

    const send = () => {
        const text = input.trim()
        if (!text) return
        const id = `u-${Date.now()}`
        setMessages((prev) => [...prev, { id, role: 'user', content: text }])
        setInput('')
        // Mock assistant reply
        const replyId = `a-${Date.now()}`
        const reply = mockReply(text, title)
        setTimeout(() => {
            setMessages((prev) => [...prev, { id: replyId, role: 'assistant', content: reply }])
        }, 250)
    }

    const applySEOTitle = () => {
        const next = makeSEOTitle(title)
        onSetTitle(next)
        setMessages((prev) => [
            ...prev,
            { id: `a-${Date.now()}`, role: 'assistant', content: `Updated title to: "${next}"` },
        ])
    }

    const generateMetaDescription = () => {
        const base = title || 'this article'
        const next = `Learn about ${base.toLowerCase()} with practical insights, best practices, and actionable tips. Discover how to implement and optimize for better results.`
        onSetSubtitle(next)
        setMessages((prev) => [
            ...prev,
            { id: `a-${Date.now()}`, role: 'assistant', content: 'Drafted a new meta description. Feel free to tweak it.' },
        ])
    }

    const chatContent = (
        <>
            <ScrollArea className="flex-1">
                <div className="px-6 py-6 space-y-2">
                    {messages.map((m) => (
                        <div key={m.id} className={m.role === 'assistant' ? 'flex gap-2 items-start' : 'flex justify-end'}>
                            {m.role === 'assistant' && (
                                <div className="mt-0.5 text-muted-foreground">
                                    <Brain className="h-3.5 w-3.5" />
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
                    ))}
                    <div ref={bottomRef} />
                </div>
            </ScrollArea>

            <div className="px-6 py-6 space-y-2">
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" className="gap-1 h-7 px-2 text-[11px] cursor-pointer" onClick={applySEOTitle}>
                        <Sparkles className="h-3.5 w-3.5" /> SEO title
                    </Button>
                    <Button variant="secondary" size="sm" className="gap-1 h-7 px-2 text-[11px] cursor-pointer" onClick={generateMetaDescription}>
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
                    <Button size="sm" className="h-9 px-3 cursor-pointer" onClick={send}>
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
                <div className="text-xs font-medium">Conversation</div>
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

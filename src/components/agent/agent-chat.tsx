import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Brain, Sparkles, Send } from 'lucide-react'

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

    const applyPunchierTitle = () => {
        const next = makePunchierTitle(title)
        onSetTitle(next)
        setMessages((prev) => [
            ...prev,
            { id: `a-${Date.now()}`, role: 'assistant', content: `Updated title to: “${next}”` },
        ])
    }

    const generateSubtitle = () => {
        const base = title || 'this article'
        const next = `A clear, succinct overview of ${base.toLowerCase()}—what it covers, why it matters, and how to get value fast.`
        onSetSubtitle(next)
        setMessages((prev) => [
            ...prev,
            { id: `a-${Date.now()}`, role: 'assistant', content: 'Drafted a new subtitle. Feel free to tweak it.' },
        ])
    }

    return (
        <aside
            className="fixed left-0 z-10 flex w-72 md:w-80 lg:w-96 flex-col border-r bg-background"
            style={{ top: topOffset, bottom: 0 }}
        >
            <header className="h-16 px-6 border-b flex items-center">
                <div className="text-xs font-medium">Conversation</div>
            </header>

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
                    <Button variant="secondary" size="sm" className="gap-1 h-7 px-2 text-[11px] cursor-pointer" onClick={applyPunchierTitle}>
                        <Sparkles className="h-3.5 w-3.5" /> Punchier title
                    </Button>
                    <Button variant="secondary" size="sm" className="gap-1 h-7 px-2 text-[11px] cursor-pointer" onClick={generateSubtitle}>
                        <Sparkles className="h-3.5 w-3.5" /> Draft subtitle
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
        </aside>
    )
}

function mockReply(input: string, currentTitle: string) {
    const q = input.toLowerCase()
    if (q.includes('title')) {
        return `Try: “${makePunchierTitle(currentTitle)}”`
    }
    if (q.includes('subtitle') || q.includes('summary')) {
        return 'I can draft a crisp, one-sentence subtitle that highlights value and context.'
    }
    return "Got it. I can help rewrite sections, generate outlines, or polish your tone."
}

function makePunchierTitle(t: string) {
    const base = (t || 'From idea to article with your AI co-writer').trim()
    const starters = ['Instantly', 'Effortlessly', 'Beautifully', 'Powerfully']
    const s = starters[Math.floor(Math.random() * starters.length)]
    if (/^from /i.test(base)) return base
    return `${s} ${base.charAt(0).toLowerCase()}${base.slice(1)}`
}

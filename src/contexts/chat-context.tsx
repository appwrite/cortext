import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

interface ChatContextType {
    chatWidth: number
    isMinimized: boolean
    setChatWidth: (width: number) => void
    setIsMinimized: (minimized: boolean) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

// localStorage keys
const CHAT_WIDTH_KEY = 'cortext-chat-width'
const CHAT_MINIMIZED_KEY = 'cortext-chat-minimized'

// Helper functions for localStorage
const getStoredChatWidth = (): number => {
    try {
        const stored = localStorage.getItem(CHAT_WIDTH_KEY)
        return stored ? parseInt(stored, 10) : 300
    } catch {
        return 300
    }
}

const getStoredMinimizedState = (): boolean => {
    try {
        const stored = localStorage.getItem(CHAT_MINIMIZED_KEY)
        return stored === 'true'
    } catch {
        return false
    }
}

export function ChatProvider({ children }: { children: ReactNode }) {
    const [chatWidth, setChatWidth] = useState(getStoredChatWidth)
    const [isMinimized, setIsMinimized] = useState(getStoredMinimizedState)

    // Save to localStorage whenever chatWidth changes
    useEffect(() => {
        try {
            localStorage.setItem(CHAT_WIDTH_KEY, chatWidth.toString())
        } catch (error) {
            console.warn('Failed to save chat width to localStorage:', error)
        }
    }, [chatWidth])

    // Save to localStorage whenever isMinimized changes
    useEffect(() => {
        try {
            localStorage.setItem(CHAT_MINIMIZED_KEY, isMinimized.toString())
        } catch (error) {
            console.warn('Failed to save minimized state to localStorage:', error)
        }
    }, [isMinimized])

    return (
        <ChatContext.Provider value={{
            chatWidth,
            isMinimized,
            setChatWidth,
            setIsMinimized
        }}>
            {children}
        </ChatContext.Provider>
    )
}

export function useChatContext() {
    const context = useContext(ChatContext)
    if (context === undefined) {
        throw new Error('useChatContext must be used within a ChatProvider')
    }
    return context
}

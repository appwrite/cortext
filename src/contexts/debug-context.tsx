import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface DebugContextType {
  isDebugMode: boolean
  toggleDebugMode: () => void
  setDebugMode: (enabled: boolean) => void
}

const DebugContext = createContext<DebugContextType | undefined>(undefined)

interface DebugProviderProps {
  children: ReactNode
}

export function DebugProvider({ children }: DebugProviderProps) {
  const [isDebugMode, setIsDebugMode] = useState(() => {
    try {
      const saved = localStorage.getItem('debug-mode-enabled')
      return saved === 'true'
    } catch {
      return false
    }
  })

  const toggleDebugMode = () => {
    setIsDebugMode(prev => !prev)
  }

  const setDebugMode = (enabled: boolean) => {
    setIsDebugMode(enabled)
  }

  // Persist debug mode to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('debug-mode-enabled', isDebugMode.toString())
    } catch (error) {
      console.warn('Failed to save debug mode to localStorage:', error)
    }
  }, [isDebugMode])

  // Global keyboard shortcut to toggle debug mode (Cmd+. or Ctrl+.)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        e.preventDefault()
        toggleDebugMode()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [toggleDebugMode])

  return (
    <DebugContext.Provider value={{ isDebugMode, toggleDebugMode, setDebugMode }}>
      {children}
    </DebugContext.Provider>
  )
}

export function useDebugMode() {
  const context = useContext(DebugContext)
  if (context === undefined) {
    throw new Error('useDebugMode must be used within a DebugProvider')
  }
  return context
}

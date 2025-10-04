import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAccountClient } from '@/lib/appwrite'
import { toast } from '@/hooks/use-toast'

export type Theme = 'light' | 'dark' | 'system'

interface ThemePreferences {
  theme?: Theme
}

export function useTheme() {
  const account = getAccountClient()
  const queryClient = useQueryClient()
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light')

  // Query user preferences
  const { data: prefs, isLoading: isLoadingPrefs } = useQuery({
    queryKey: ['auth', 'preferences'],
    queryFn: () => account.getPrefs(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Get current theme from preferences, localStorage fallback, or default to system
  const getStoredTheme = (): Theme => {
    const stored = localStorage.getItem('theme') as Theme
    return stored && ['light', 'dark', 'system'].includes(stored) ? stored : 'system'
  }

  const currentTheme: Theme = (prefs as ThemePreferences)?.theme || getStoredTheme()

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light')

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Get effective theme (resolves 'system' to actual theme)
  const effectiveTheme = currentTheme === 'system' ? systemTheme : currentTheme

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(effectiveTheme)
  }, [effectiveTheme])

  // Update preferences mutation
  const updateThemeMutation = useMutation({
    mutationFn: async (theme: Theme) => {
      // Store in localStorage immediately for instant UI update
      localStorage.setItem('theme', theme)
      
      const currentPrefs = prefs as ThemePreferences || {}
      const updatedPrefs = { ...currentPrefs, theme }
      return account.updatePrefs(updatedPrefs)
    },
    onSuccess: (_, theme) => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'preferences'] })
      toast({
        title: 'Theme updated',
        description: `Theme changed to ${theme === 'system' ? 'system' : theme} mode`
      })
    },
    onError: (error) => {
      console.error('Failed to update theme:', error)
      // Revert localStorage on error
      const fallbackTheme = (prefs as ThemePreferences)?.theme || 'system'
      localStorage.setItem('theme', fallbackTheme)
      toast({
        title: 'Failed to update theme',
        description: 'Could not save theme preference',
        variant: 'destructive'
      })
    }
  })

  const setTheme = (theme: Theme) => {
    updateThemeMutation.mutate(theme)
  }

  return {
    theme: currentTheme,
    effectiveTheme,
    systemTheme,
    setTheme,
    isLoading: isLoadingPrefs || updateThemeMutation.isPending,
    isUpdating: updateThemeMutation.isPending
  }
}

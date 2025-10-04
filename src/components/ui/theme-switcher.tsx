import { Monitor, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useThemeContext, Theme } from '@/contexts/theme-context'

interface ThemeSwitcherProps {
  className?: string
  variant?: 'default' | 'ghost' | 'outline' | 'secondary' | 'destructive' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showLabel?: boolean
}

const themeOptions = [
  { value: 'light' as Theme, label: 'Light', icon: Sun },
  { value: 'dark' as Theme, label: 'Dark', icon: Moon },
  { value: 'system' as Theme, label: 'System', icon: Monitor },
]

// Compact segmented control like in the screenshot
export function ThemeSwitcherCompact({ className }: { className?: string }) {
  const { theme, setTheme, isUpdating } = useThemeContext()

  return (
    <div className={cn("inline-flex items-center rounded-lg bg-muted p-1", className)}>
      {themeOptions.map((option) => {
        const Icon = option.icon
        const isSelected = theme === option.value
        
        return (
          <Button
            key={option.value}
            variant="ghost"
            size="sm"
            onClick={() => setTheme(option.value)}
            disabled={isUpdating}
            className={cn(
              "relative h-8 px-3 cursor-pointer transition-all duration-200",
              "hover:bg-transparent",
              isSelected 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
            title={`Switch to ${option.label} theme`}
          >
            <Icon className="h-4 w-4" />
          </Button>
        )
      })}
    </div>
  )
}

// Full theme switcher with labels
export function ThemeSwitcher({ 
  className, 
  variant = 'ghost', 
  size = 'sm',
  showLabel = true 
}: ThemeSwitcherProps) {
  const { theme, setTheme, isUpdating } = useThemeContext()

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {themeOptions.map((option) => {
        const Icon = option.icon
        const isSelected = theme === option.value
        
        return (
          <Button
            key={option.value}
            variant={variant}
            size={size}
            onClick={() => setTheme(option.value)}
            disabled={isUpdating}
            className={cn(
              "relative cursor-pointer transition-colors",
              isSelected && "bg-accent text-accent-foreground",
              "hover:bg-accent/80"
            )}
            title={`Switch to ${option.label} theme`}
          >
            <Icon className="h-4 w-4" />
            {showLabel && (
              <span className="ml-2 text-sm">{option.label}</span>
            )}
            {isSelected && (
              <div className="absolute inset-0 rounded-md ring-2 ring-ring ring-offset-2 ring-offset-background" />
            )}
          </Button>
        )
      })}
    </div>
  )
}

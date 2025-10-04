import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useThemeContext } from '@/contexts/theme-context'
import { cn } from '@/lib/utils'

interface StandardAvatarProps {
  className?: string
  fallbackClassName?: string
  initials?: string
  src?: string
  alt?: string
}

export function StandardAvatar({ 
  className, 
  fallbackClassName,
  initials = 'U',
  src,
  alt 
}: StandardAvatarProps) {
  const { effectiveTheme } = useThemeContext()
  
  // Use white text on black background for light theme, black text on white background for dark theme
  const isDark = effectiveTheme === 'dark'
  const bgColor = isDark ? 'bg-white' : 'bg-black'
  const textColor = isDark ? 'text-black' : 'text-white'

  return (
    <Avatar className={className}>
      {src && <AvatarImage src={src} alt={alt} />}
      <AvatarFallback 
        className={cn(
          "text-xs font-medium",
          bgColor,
          textColor,
          fallbackClassName
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}

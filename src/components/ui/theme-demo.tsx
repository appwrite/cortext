import { StandardAvatar } from './standard-avatar'
import { ThemeSwitcherCompact } from './theme-switcher'

// Demo component to showcase the new theme switcher and avatar
export function ThemeDemo() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Theme Switcher</h3>
        <p className="text-sm text-muted-foreground">
          Compact segmented control for theme selection
        </p>
        <ThemeSwitcherCompact />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Standard Avatars</h3>
        <p className="text-sm text-muted-foreground">
          Consistent white/black color scheme that adapts to theme
        </p>
        <div className="flex items-center gap-4">
          <StandardAvatar initials="JD" />
          <StandardAvatar initials="AB" />
          <StandardAvatar initials="SM" />
          <StandardAvatar initials="U" />
        </div>
      </div>
    </div>
  )
}

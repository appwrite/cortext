import { useState, useRef, useEffect } from 'react'
import { LogOut, User, Mail, Calendar, Settings, Shield, Copy, Check, Palette, Send, AlertTriangle, AlertCircle } from 'lucide-react'
import { StandardAvatar } from '@/components/ui/standard-avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ThemeSwitcherCompact } from '@/components/ui/theme-switcher'
import { AccountSettingsModal } from '@/components/account/account-settings-modal'
import { SessionsModal } from '@/components/account/sessions-modal'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { getAccountClient } from '@/lib/appwrite'

interface UserAvatarProps {
  user: {
    $id?: string
    name?: string
    email?: string
    $createdAt?: string
    emailVerification?: boolean
    phoneVerification?: boolean
  } | null
  onSignOut: () => void
}

export function UserAvatar({ user, onSignOut }: UserAvatarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSessionsOpen, setIsSessionsOpen] = useState(false)
  const [copiedId, setCopiedId] = useState(false)
  const [isSendingVerification, setIsSendingVerification] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Generate initials from name or email
  const getInitials = () => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return 'U'
  }

  // Get display name
  const getDisplayName = () => {
    if (user?.name) return user.name
    if (user?.email) return user.email
    return 'User'
  }

  // Get user status
  const getUserStatus = () => {
    if (user?.emailVerification && user?.phoneVerification) {
      return { text: 'Verified', variant: 'default' as const }
    } else if (user?.emailVerification) {
      return { text: 'Verified', variant: 'secondary' as const }
    } else {
      return { text: 'Unverified', variant: 'outline' as const }
    }
  }

  // Format join date
  const getJoinDate = () => {
    if (!user?.$createdAt) return 'Unknown'
    const date = new Date(user.$createdAt)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    })
  }

  // Get user role/type
  const getUserRole = () => {
    // This could be enhanced based on your app's role system
    return 'Member'
  }

  // Check if account is older than 2 days
  const isAccountOld = () => {
    if (!user?.$createdAt) return false
    const accountCreated = new Date(user.$createdAt)
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
    return accountCreated < twoDaysAgo
  }

  // Copy account ID to clipboard
  const copyAccountId = async () => {
    if (!user?.$id) return
    
    try {
      await navigator.clipboard.writeText(user.$id)
      setCopiedId(true)
      toast({
        title: 'Account ID copied',
        description: 'Account ID has been copied to clipboard'
      })
      
      // Reset the copied state after 2 seconds
      setTimeout(() => setCopiedId(false), 2000)
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy account ID to clipboard',
        variant: 'destructive'
      })
    }
  }

  // Send email verification
  const sendEmailVerification = async () => {
    if (!user?.email || user?.emailVerification) return
    
    setIsSendingVerification(true)
    try {
      const account = getAccountClient()
      await account.createVerification({ url: `${window.location.origin}/verify-email` })
      
      toast({
        title: 'Verification email sent',
        description: 'Please check your email and click the verification link'
      })
    } catch (error: any) {
      toast({
        title: 'Failed to send verification',
        description: error.message || 'Could not send verification email',
        variant: 'destructive'
      })
    } finally {
      setIsSendingVerification(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative cursor-pointer"
        aria-label="User menu"
      >
        <StandardAvatar 
          className="h-6 w-6"
          initials={getInitials()}
        />
        {/* Warning badge for old unverified accounts */}
        {isAccountOld() && !user?.emailVerification && (
          <Badge 
            variant="outline"
            className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center min-w-[20px] bg-muted text-muted-foreground border-muted-foreground/20"
          >
            !
          </Badge>
        )}
      </Button>
      
      {isOpen && (
        <>
          {/* Arrow pointing to the avatar - matching notification style */}
          <div className="absolute right-3 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-border z-50" />
          <div className="absolute right-0 top-full mt-1 w-80 bg-background border rounded-xl shadow-xl z-50 animate-in fade-in-0 zoom-in-95 duration-200 overflow-hidden">
            {/* User details section */}
            <div className="p-4 space-y-4">
              {/* Email */}
              {user?.email && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-muted-foreground text-xs">Email</p>
                    <p className="font-medium truncate">{user.email}</p>
                  </div>
                </div>
              )}

              {/* Join date */}
              <div className="flex items-center gap-3 text-sm">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-muted-foreground text-xs">Member since</p>
                  <p className="font-medium">{getJoinDate()}</p>
                </div>
              </div>

              {/* Account status */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-muted-foreground text-xs">Account status</p>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        getUserStatus().variant === 'default' ? "bg-green-500 dark:bg-green-400" : 
                        getUserStatus().variant === 'secondary' ? "bg-green-500 dark:bg-green-400" : "bg-gray-500 dark:bg-gray-400"
                      )} />
                      <p className="font-medium">{getUserStatus().text}</p>
                    </div>
                  </div>
                </div>
                {/* Email verification button */}
                {user?.email && !user?.emailVerification && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={sendEmailVerification}
                    disabled={isSendingVerification}
                    className={cn(
                      "h-8 px-3",
                      isAccountOld() && "border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:border-yellow-400 dark:text-yellow-400 dark:hover:bg-yellow-950/20"
                    )}
                  >
                    {isAccountOld() ? (
                      <AlertTriangle className="h-0.5 w-0.5 mr-1" />
                    ) : (
                      <Send className="h-4 w-4 mr-1" />
                    )}
                    {isSendingVerification ? 'Sending...' : 'Verify'}
                  </Button>
                )}
              </div>

              {/* Account ID */}
              {user?.$id && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-muted-foreground text-xs">Account ID</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-xs font-medium truncate">{user.$id}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyAccountId}
                        className="h-6 w-6 p-0 hover:bg-accent cursor-pointer"
                        title="Copy Account ID"
                      >
                        {copiedId ? (
                          <Check className="h-3 w-3 text-green-500 dark:text-green-400" />
                        ) : (
                          <Copy className="h-3 w-3 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Theme Settings */}
            <div className="p-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-muted-foreground text-xs">Theme</p>
                    <p className="font-medium text-sm">Appearance</p>
                  </div>
                </div>
                <ThemeSwitcherCompact />
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="p-3 space-y-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsSessionsOpen(true)
                  setIsOpen(false)
                }}
                className="w-full justify-start cursor-pointer hover:bg-accent"
              >
                <Shield className="h-4 w-4 mr-2" />
                Sessions
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsSettingsOpen(true)
                  setIsOpen(false)
                }}
                className="w-full justify-start cursor-pointer hover:bg-accent"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onSignOut()
                  setIsOpen(false)
                }}
                className="w-full justify-start cursor-pointer hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </Button>
            </div>
          </div>
        </>
      )}
      
      {/* Account Settings Modal */}
      <AccountSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        onSignOut={onSignOut}
      />
      
      {/* Sessions Modal */}
      <SessionsModal
        isOpen={isSessionsOpen}
        onClose={() => setIsSessionsOpen(false)}
      />
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { LogOut, User, Mail, Calendar, Settings, Shield, Copy, Check } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

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
  const [copiedId, setCopiedId] = useState(false)
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
      return { text: 'Email Verified', variant: 'secondary' as const }
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

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-6 w-6 rounded-full p-0 cursor-pointer hover:bg-accent"
        aria-label="User menu"
      >
        <Avatar className="h-6 w-6">
          <AvatarFallback className="bg-black text-white text-xs font-medium">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
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
              <div className="flex items-center gap-3 text-sm">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-muted-foreground text-xs">Account status</p>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      getUserStatus().variant === 'default' ? "bg-green-500" : 
                      getUserStatus().variant === 'secondary' ? "bg-yellow-500" : "bg-gray-400"
                    )} />
                    <p className="font-medium">{getUserStatus().text}</p>
                  </div>
                </div>
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
                          <Check className="h-3 w-3 text-green-600" />
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

            {/* Actions */}
            <div className="p-3 space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start cursor-pointer hover:bg-muted"
              >
                <Settings className="h-4 w-4 mr-2" />
                Account Settings
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
    </div>
  )
}

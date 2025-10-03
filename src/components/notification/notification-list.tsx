import { useNotifications } from '@/components/notification/use-notifications'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { ExternalLink, Check, CheckCheck, Bell, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NotificationListProps {
  userId: string
}

export function NotificationList({ userId }: NotificationListProps) {
  const { 
    notifications, 
    isLoading, 
    markAsRead, 
    markAllAsRead,
    hasUnread 
  } = useNotifications(userId)

  const getNotificationIcon = (type: string | null) => {
    switch (type) {
      case 'success':
        return <Check className="h-4 w-4 text-green-600" />
      case 'error':
        return <X className="h-4 w-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return <Bell className="h-4 w-4 text-blue-600" />
    }
  }

  const getNotificationStyle = (type: string | null, read: boolean) => {
    const baseStyle = "p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors"
    const unreadStyle = "bg-blue-50/50 border-l-4 border-l-blue-500"
    return cn(baseStyle, !read && unreadStyle)
  }

  if (isLoading) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Loading notifications...
      </div>
    )
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No notifications yet
      </div>
    )
  }

  return (
    <div className="max-h-96">
      {hasUnread && (
        <div className="p-2 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllAsRead()}
            className="w-full justify-start text-xs"
          >
            <CheckCheck className="h-3 w-3 mr-2" />
            Mark all as read
          </Button>
        </div>
      )}
      
      <ScrollArea className="max-h-80">
        {notifications.map((notification) => (
          <div
            key={notification.$id}
            className={getNotificationStyle(notification.type, notification.read)}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-medium text-foreground truncate">
                    {notification.title}
                  </h4>
                  {!notification.read && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                      New
                    </Badge>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {notification.message}
                </p>
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.$createdAt), { addSuffix: true })}
                  </span>
                  
                  <div className="flex items-center gap-1">
                    {notification.actionUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-6 px-2 text-xs"
                      >
                        <a 
                          href={notification.actionUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          {notification.actionText || 'View'}
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </Button>
                    )}
                    
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.$id)}
                        className="h-6 px-2 text-xs"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  )
}

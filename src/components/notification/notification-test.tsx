import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createSampleNotifications, createTestNotification } from '@/lib/notification-utils'
import { toast } from '@/hooks/use-toast'
import { Bell, Loader2, Plus, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react'

interface NotificationTestProps {
  userId: string
}

export function NotificationTest({ userId }: NotificationTestProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [isCreatingTest, setIsCreatingTest] = useState<string | null>(null)

  const handleCreateSampleNotifications = async () => {
    try {
      setIsCreating(true)
      await createSampleNotifications(userId)
      toast({ 
        title: 'Sample notifications created!', 
        description: 'Check the notification bell to see them.' 
      })
    } catch (error) {
      toast({ 
        title: 'Failed to create sample notifications', 
        variant: 'destructive' 
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleCreateTestNotification = async (type: 'info' | 'success' | 'warning' | 'error') => {
    try {
      setIsCreatingTest(type)
      await createTestNotification(userId, type)
      toast({ 
        title: 'Test notification sent!', 
        description: 'You should see a realtime notification appear.' 
      })
    } catch (error) {
      toast({ 
        title: 'Failed to create test notification', 
        variant: 'destructive' 
      })
    } finally {
      setIsCreatingTest(null)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-3 w-3" />
      case 'warning': return <AlertTriangle className="h-3 w-3" />
      case 'error': return <XCircle className="h-3 w-3" />
      default: return <Info className="h-3 w-3" />
    }
  }

  return (
    <div className="p-4 border rounded-lg bg-muted/50">
      <h3 className="text-sm font-medium mb-2">Notification System Test</h3>
      <p className="text-xs text-muted-foreground mb-3">
        Test the notification system and realtime updates.
      </p>
      
      <div className="space-y-2">
        <Button
          onClick={handleCreateSampleNotifications}
          disabled={isCreating}
          size="sm"
          variant="outline"
          className="cursor-pointer w-full justify-start"
        >
          {isCreating ? (
            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
          ) : (
            <Bell className="h-3 w-3 mr-2" />
          )}
          {isCreating ? 'Creating...' : 'Create Sample Notifications'}
        </Button>

        <div className="text-xs text-muted-foreground mb-2">Test Realtime Notifications:</div>
        <div className="grid grid-cols-2 gap-1">
          {(['info', 'success', 'warning', 'error'] as const).map((type) => (
            <Button
              key={type}
              onClick={() => handleCreateTestNotification(type)}
              disabled={isCreatingTest === type}
              size="sm"
              variant="ghost"
              className="cursor-pointer h-8 text-xs justify-start"
            >
              {isCreatingTest === type ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                getIcon(type)
              )}
              <span className="ml-1 capitalize">{type}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

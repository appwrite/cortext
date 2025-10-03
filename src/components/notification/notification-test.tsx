import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createSampleNotifications } from '@/lib/notification-utils'
import { toast } from '@/hooks/use-toast'
import { Bell, Loader2 } from 'lucide-react'

interface NotificationTestProps {
  userId: string
}

export function NotificationTest({ userId }: NotificationTestProps) {
  const [isCreating, setIsCreating] = useState(false)

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

  return (
    <div className="p-4 border rounded-lg bg-muted/50">
      <h3 className="text-sm font-medium mb-2">Notification System Test</h3>
      <p className="text-xs text-muted-foreground mb-3">
        Create sample notifications to test the notification system.
      </p>
      <Button
        onClick={handleCreateSampleNotifications}
        disabled={isCreating}
        size="sm"
        variant="outline"
        className="cursor-pointer"
      >
        {isCreating ? (
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        ) : (
          <Bell className="h-3 w-3 mr-1" />
        )}
        {isCreating ? 'Creating...' : 'Create Sample Notifications'}
      </Button>
    </div>
  )
}

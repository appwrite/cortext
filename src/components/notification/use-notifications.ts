import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db, client } from '@/lib/appwrite/db'
import { Query } from 'appwrite'
import { toast } from '@/hooks/use-toast'
import { useEffect, useRef } from 'react'

export function useNotifications(userId: string) {
  const queryClient = useQueryClient()
  const subscriptionRef = useRef<any>(null)

  // Fetch notifications for the user
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      const response = await db.notifications.list([
        Query.equal('userId', userId),
        Query.orderDesc('$createdAt'),
        Query.limit(50) // Limit to 50 most recent notifications
      ])
      return response.documents
    },
    enabled: !!userId,
    refetchInterval: false, // Disable polling since we're using realtime
  })

  // Set up realtime subscription for notifications
  useEffect(() => {
    if (!userId) return

    // Subscribe to notifications for this specific user
    const channel = `databases.${import.meta.env.VITE_APPWRITE_DATABASE_ID}.tables.notifications.rows`
    
    subscriptionRef.current = client.subscribe(channel, (response) => {
      // Check if this notification is for the current user
      if (response.payload && typeof response.payload === 'object' && 'userId' in response.payload && response.payload.userId === userId) {
        // Invalidate and refetch notifications
        queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
        
        // Show a toast for new notifications (only for create events)
        if (response.events.some(event => event.includes('.create'))) {
          const payload = response.payload as any
          toast({
            title: 'New notification',
            description: payload.title || 'You have a new notification',
            duration: 3000,
          })
        }
      }
    })

    // Cleanup subscription on unmount
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current()
        subscriptionRef.current = null
      }
    }
  }, [userId, queryClient])

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return db.notifications.update(notificationId, { read: true })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
    },
    onError: () => {
      toast({ title: 'Failed to mark notification as read', variant: 'destructive' })
    },
  })

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!notifications) return
      
      const unreadNotifications = notifications.filter(n => !n.read)
      const updatePromises = unreadNotifications.map(notification =>
        db.notifications.update(notification.$id, { read: true })
      )
      
      await Promise.all(updatePromises)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
      toast({ title: 'All notifications marked as read' })
    },
    onError: () => {
      toast({ title: 'Failed to mark all notifications as read', variant: 'destructive' })
    },
  })

  // Calculate unread count
  const unreadCount = notifications?.filter(n => !n.read).length || 0
  const hasUnread = unreadCount > 0

  return {
    notifications,
    isLoading,
    unreadCount,
    hasUnread,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  }
}

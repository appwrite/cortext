import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '@/lib/appwrite/db'
import { Query } from 'appwrite'
import { toast } from '@/hooks/use-toast'

export function useNotifications(userId: string) {
  const queryClient = useQueryClient()

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
    refetchInterval: 30000, // Refetch every 30 seconds
  })

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

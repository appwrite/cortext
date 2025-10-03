import { db } from './appwrite/db'
import type { Notifications } from './appwrite/appwrite.types'

export type CreateNotificationData = Omit<Notifications, keyof import('appwrite').Models.Document>

export async function createNotification(data: CreateNotificationData) {
  return db.notifications.create(data)
}

export async function createSampleNotifications(userId: string) {
  const sampleNotifications: CreateNotificationData[] = [
    {
      userId,
      title: 'Welcome to Cortext!',
      message: 'Your account has been successfully created. Start by creating your first article.',
      type: 'success',
      read: false,
      actionUrl: '/dashboard?new=1',
      actionText: 'Create Article'
    },
    {
      userId,
      title: 'New Feature Available',
      message: 'We\'ve added a new notification system to keep you updated on important events.',
      type: 'info',
      read: false,
      actionUrl: '/dashboard',
      actionText: 'View Dashboard'
    },
    {
      userId,
      title: 'Article Published',
      message: 'Your article "Getting Started with Cortext" has been successfully published.',
      type: 'success',
      read: true,
      actionUrl: '/dashboard',
      actionText: 'View Article'
    },
    {
      userId,
      title: 'System Maintenance',
      message: 'Scheduled maintenance will occur tonight from 2 AM to 4 AM EST. Some features may be temporarily unavailable.',
      type: 'warning',
      read: false,
      actionUrl: null,
      actionText: null
    }
  ]

  try {
    const results = await Promise.all(
      sampleNotifications.map(notification => createNotification(notification))
    )
    return results
  } catch (error) {
    console.error('Failed to create sample notifications:', error)
    throw error
  }
}

export async function createTestNotification(userId: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
  const messages = {
    info: {
      title: 'New Update Available',
      message: 'A new version of Cortext is now available with improved performance and new features.',
    },
    success: {
      title: 'Action Completed Successfully',
      message: 'Your recent action has been completed successfully.',
    },
    warning: {
      title: 'Important Notice',
      message: 'Please review your recent changes as they may affect your published content.',
    },
    error: {
      title: 'Action Failed',
      message: 'There was an issue with your recent action. Please try again.',
    }
  }

  const notification: CreateNotificationData = {
    userId,
    title: messages[type].title,
    message: messages[type].message,
    type,
    read: false,
    actionUrl: '/dashboard',
    actionText: 'View Dashboard'
  }

  try {
    return await createNotification(notification)
  } catch (error) {
    console.error('Failed to create test notification:', error)
    throw error
  }
}

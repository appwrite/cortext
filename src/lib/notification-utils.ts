import { db } from './appwrite/db'
import type { Notifications } from './appwrite/appwrite.types'

export type CreateNotificationData = Omit<Notifications, keyof import('appwrite').Models.Document>

export async function createNotification(data: CreateNotificationData) {
  return db.notifications.create(data)
}


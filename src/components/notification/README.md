# Notification System

This notification system provides a complete solution for managing user notifications in the Cortext application.

## Features

- **Real-time notifications** using Appwrite Realtime API
- **Instant updates** - no polling, notifications appear immediately
- **Toast notifications** for new notifications
- **Unread count badge** on the notification bell
- **Popover-style dropdown** with arrow pointing to the bell icon
- **Auto-close on focus loss** - no need for close button
- **Mark as read** functionality for individual notifications
- **Mark all as read** functionality
- **Action buttons** for notifications with URLs
- **Different notification types** (info, success, warning, error)
- **Responsive design** with scrollable notification list
- **Smooth animations** for dropdown appearance

## Components

### NotificationBell
The main notification component that displays a bell icon with an unread count badge.

```tsx
import { NotificationBell } from '@/components/notification'

<NotificationBell userId={userId} />
```

### NotificationList
Displays the list of notifications in a dropdown/popover format.

```tsx
import { NotificationList } from '@/components/notification'

<NotificationList userId={userId} />
```

### useNotifications Hook
Custom hook that manages notification state and operations.

```tsx
import { useNotifications } from '@/components/notification'

const { 
  notifications, 
  unreadCount, 
  markAsRead, 
  markAllAsRead 
} = useNotifications(userId)
```

## Database Schema

The notifications collection includes the following fields:

- `userId` (string, required): ID of the user who owns the notification
- `title` (string, required): Notification title
- `message` (string, required): Notification message content
- `type` (string, optional): Notification type (info, success, warning, error)
- `read` (boolean, optional): Whether the notification has been read
- `actionUrl` (string, optional): URL for action button
- `actionText` (string, optional): Text for action button

## Usage

1. **Setup**: Run the Appwrite setup script to create the notifications collection:
   ```bash
   npm run setup:appwrite
   ```

2. **Create notifications**: Use the utility functions to create notifications:
   ```tsx
   import { createNotification } from '@/lib/notification-utils'
   
   // Create a single notification
   await createNotification({
     userId: 'user123',
     title: 'New Article Published',
     message: 'Your article has been successfully published.',
     type: 'success',
     actionUrl: '/dashboard',
     actionText: 'View Article'
   })
   ```

3. **Display notifications**: Add the NotificationBell to your header:
   ```tsx
   <NotificationBell userId={userId} />
   ```

## Styling

The notification system uses Tailwind CSS classes and follows the existing design system. Key styling features:

- Unread notifications have a blue left border and background tint
- Different notification types have colored icons
- Responsive design that works on mobile and desktop
- Smooth animations and transitions

## Realtime Integration

The notification system uses [Appwrite Realtime API](https://appwrite.io/docs/apis/realtime) to provide instant updates:

- **WebSocket connection** to the notifications table
- **Automatic subscription** when the component mounts
- **User-specific filtering** - only receives notifications for the current user
- **Event-based updates** - responds to create, update, and delete events
- **Automatic cleanup** - unsubscribes when component unmounts


import { Client as ServerClient, Databases as ServerDatabases, ID as ServerID, Permission as ServerPermission, Role as ServerRole, Query as ServerQuery } from 'node-appwrite';

/**
 * Notification Function Architecture:
 * - Uses server SDK with dynamic API key for all database operations
 * - Creates notification documents in the notifications collection
 * - Provides proper error handling and validation
 * - Supports different notification types and optional action buttons
 */

// Initialize server client for database operations with dynamic API key
const serverClient = new ServerClient();
const serverDatabases = new ServerDatabases(serverClient);

// Set up the client with environment variables
const endpoint = process.env.APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_PROJECT_ID;

if (!endpoint) {
  throw new Error('APPWRITE_ENDPOINT environment variable is required');
}

if (!projectId) {
  throw new Error('APPWRITE_PROJECT_ID environment variable is required');
}

export default async function ({ req, res, log, error }) {
  try {
    // Log the incoming request
    log('Notification function called');
    log('Request method: ' + req.method);
    log('Request headers: ' + JSON.stringify(req.headers));

    // Get dynamic API key from headers
    const dynamicApiKey = req.headers['x-appwrite-key'];
    
    log('Dynamic API key present: ' + (dynamicApiKey ? 'Yes' : 'No'));

    // Validate dynamic API key for server operations
    if (!dynamicApiKey) {
      return res.json({
        success: false,
        error: 'Dynamic API key required. Please provide x-appwrite-key header.'
      }, 401);
    }

    // Configure server client for database operations with dynamic API key
    serverClient
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(dynamicApiKey);
    
    log('Server client configured with dynamic API key');

    // Use hardcoded notification values for demonstration
    const notificationData = {
        userId: '68dd2cc50002d18c9e42',
        title: 'Welcome to Cortext Eldad test!',
        message: 'Thank you for joining our platform. Start creating amazing content with AI assistance.',
        type: 'success',
        actionUrl: 'https://cortext.app/content',
        actionText: 'Go to Content',
        blogId: '68e01ea6002132bfaf1d'
      };
    
    log('Using hardcoded notification: ' + JSON.stringify(notificationData));

    const { userId, title, message, type, actionUrl, actionText, blogId } = notificationData;

    // Get database ID from environment
    const databaseId = 'your-production-database-id';
    
    if (!databaseId) {
      return res.json({
        success: false,
        error: 'APPWRITE_DATABASE_ID environment variable is required'
      }, 500);
    }

    // Create the notification document in the database using server SDK
    const notification = await serverDatabases.createDocument(
      databaseId,
      'notifications',
      ServerID.unique(),
      {
        userId,
        title,
        message,
        type: type,
        read: false,
        actionUrl: actionUrl || null,
        actionText: actionText || null,
        blogId: blogId || null
      },
      [
        // Users can read their own notifications
        ServerPermission.read(ServerRole.user(userId)),
        // Users can update their own notifications (for marking as read)
        ServerPermission.update(ServerRole.user(userId))
      ]
    );

    log('Notification created successfully with ID: ' + notification.$id);

    // Return success response with notification data
    return res.json({
      success: true,
      notification: {
        id: notification.$id,
        userId: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: notification.read,
        actionUrl: notification.actionUrl,
        actionText: notification.actionText,
        blogId: notification.blogId,
        createdAt: notification.$createdAt,
        updatedAt: notification.$updatedAt
      }
    });

  } catch (err) {
    error('Function execution failed: ' + err.message);
    error('Stack trace: ' + err.stack);
    
    return res.json({
      success: false,
      error: 'Internal server error',
      message: err.message
    }, 500);
  }
}

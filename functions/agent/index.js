import { Client, Databases, ID, Permission, Role, Query } from 'appwrite';
import { Client as ServerClient, Databases as ServerDatabases, ID as ServerID, Permission as ServerPermission, Role as ServerRole, Query as ServerQuery } from 'node-appwrite';

/**
 * Agent Function Architecture:
 * - Uses client SDK with JWT token for user authentication and verification
 * - Uses server SDK with dynamic API key for all database write operations
 * - This provides better security by separating authentication from data operations
 * - Dynamic API key allows fine-grained permissions for server-side operations
 */

// Initialize Appwrite client for JWT authentication
const client = new Client();
const databases = new Databases(client);

// Initialize server client for database writes with dynamic API key
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

// Configure client for JWT authentication
client
  .setEndpoint(endpoint)
  .setProject(projectId);

export default async function ({ req, res, log, error }) {
  try {
    // Log the incoming request
    log('Agent function called');
    log('Request method: ' + req.method);
    log('Request headers: ' + JSON.stringify(req.headers));

    // Get JWT token and dynamic API key from headers
    const jwtToken = req.headers['x-appwrite-user-jwt'];
    const userId = req.headers['x-appwrite-user-id'];
    const dynamicApiKey = req.headers['x-appwrite-key'];
    
    log('JWT token present: ' + (jwtToken ? 'Yes' : 'No'));
    log('User ID: ' + (userId || 'Not provided'));
    log('Dynamic API key present: ' + (dynamicApiKey ? 'Yes' : 'No'));

    // Authenticate using JWT token for user verification
    if (jwtToken) {
      client.setJWT(jwtToken);
      log('Authenticated with JWT token');
    } else {
      return res.json({
        success: false,
        error: 'Authentication required. Please provide JWT token.'
      }, 401);
    }

    // Validate dynamic API key for server operations
    if (!dynamicApiKey) {
      return res.json({
        success: false,
        error: 'Dynamic API key required. Please provide x-appwrite-key header.'
      }, 401);
    }

    // Configure server client for database writes with dynamic API key
    serverClient
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(dynamicApiKey);
    
    log('Server client configured with dynamic API key');

    // Parse the request body
    const body = req.bodyJson;
    log('Request body: ' + JSON.stringify(body));

    // Validate required fields
    if (!body) {
      return res.json({
        success: false,
        error: 'Request body is required'
      }, 400);
    }

    const { conversationId, agentId, blogId, metadata } = body;

    // Use userId from JWT token if available, otherwise from request body
    const messageUserId = userId || body.userId;

    if (!conversationId) {
      return res.json({
        success: false,
        error: 'conversationId is required'
      }, 400);
    }

    if (!blogId) {
      return res.json({
        success: false,
        error: 'blogId is required'
      }, 400);
    }

    // If using JWT authentication, userId should be available from the token
    if (jwtToken && !messageUserId) {
      return res.json({
        success: false,
        error: 'User authentication required. Please ensure you are logged in.'
      }, 401);
    }

    // Get database ID from environment
    const databaseId = process.env.APPWRITE_DATABASE_ID;
    
    if (!databaseId) {
      return res.json({
        success: false,
        error: 'APPWRITE_DATABASE_ID environment variable is required'
      }, 500);
    }

    // Function to generate dummy LLM response based on conversation context
    function generateDummyLLMResponse(messages, agentId) {
      const userMessages = messages.filter(msg => msg.role === 'user');
      const lastUserMessage = userMessages[userMessages.length - 1];
      
      if (!lastUserMessage) {
        return "Hello! I'm your AI assistant. How can I help you today?";
      }
      
      // Simple dummy responses based on common patterns
      const userContent = lastUserMessage.content.toLowerCase();
      
      if (userContent.includes('hello') || userContent.includes('hi')) {
        return "Hello! I'm here to help you. What would you like to know?";
      } else if (userContent.includes('help')) {
        return "I'd be happy to help you! Could you please provide more details about what you need assistance with?";
      } else if (userContent.includes('question')) {
        return "I'm ready to answer your question. Please go ahead and ask!";
      } else if (userContent.includes('thank')) {
        return "You're welcome! Is there anything else I can help you with?";
      } else if (userContent.includes('bye') || userContent.includes('goodbye')) {
        return "Goodbye! Feel free to come back anytime if you need assistance.";
      } else {
        return `I understand you're asking about "${lastUserMessage.content.substring(0, 50)}...". This is a dummy response from the AI agent. In a real implementation, this would be processed by an actual LLM with the full conversation context.`;
      }
    }

    // Load conversation history for LLM context using server SDK
    log('Loading conversation history for conversation: ' + conversationId);
    const conversationMessages = await serverDatabases.listDocuments(
      databaseId,
      'messages',
      [
        ServerQuery.equal('conversationId', conversationId),
        ServerQuery.orderAsc('$createdAt')
      ]
    );

    log(`Found ${conversationMessages.total} messages in conversation`);

    // Generate dummy LLM response based on conversation context
    const dummyResponse = generateDummyLLMResponse(conversationMessages.documents, agentId);
    log('Generated dummy LLM response: ' + dummyResponse.substring(0, 100) + '...');

    // Create the message in the database using server SDK
    // Agent messages should be read-only for users (no write permissions)
    const message = await serverDatabases.createDocument(
      databaseId,
      'messages',
      ServerID.unique(),
      {
        conversationId,
        content: dummyResponse,
        role: 'assistant',
        userId: messageUserId || null,
        agentId: agentId || 'dummy-agent',
        blogId,
        metadata: metadata ? JSON.stringify(metadata) : JSON.stringify({
          model: 'dummy-llm',
          temperature: 0.7,
          generatedAt: new Date().toISOString()
        }),
        isEdited: false
      },
      [
        // Users can only read agent messages, not modify or delete them
        ...(messageUserId ? [
          ServerPermission.read(ServerRole.user(messageUserId))
        ] : [])
      ]
    );

    log('Message created successfully with ID: ' + message.$id);

    // Update conversation's last message time and count using server SDK
    try {
      // Get current conversation
      const conversation = await serverDatabases.getDocument(databaseId, 'conversations', conversationId);
      
      // Update conversation with new message count and timestamp
      await serverDatabases.updateDocument(databaseId, 'conversations', conversationId, {
        lastMessageAt: new Date().toISOString(),
        messageCount: (conversation.messageCount || 0) + 1
      });

      log('Conversation updated successfully');
    } catch (conversationError) {
      error('Failed to update conversation: ' + conversationError.message);
      // Don't fail the entire request if conversation update fails
    }

    // Prepare conversation history for LLM context
    const conversationHistory = conversationMessages.documents.map(msg => ({
      id: msg.$id,
      role: msg.role,
      content: msg.content,
      userId: msg.userId,
      agentId: msg.agentId,
      createdAt: msg.$createdAt,
      metadata: msg.metadata ? JSON.parse(msg.metadata) : null
    }));

    log('Prepared conversation history with ' + conversationHistory.length + ' messages');

    // Return success response with conversation history for LLM
    return res.json({
      success: true,
      message: {
        id: message.$id,
        conversationId: message.conversationId,
        content: message.content,
        role: message.role,
        userId: message.userId,
        agentId: message.agentId,
        blogId: message.blogId,
        metadata: message.metadata,
        createdAt: message.$createdAt,
        updatedAt: message.$updatedAt
      },
      conversationHistory: conversationHistory,
      conversationStats: {
        totalMessages: conversationMessages.total,
        userMessages: conversationHistory.filter(msg => msg.role === 'user').length,
        assistantMessages: conversationHistory.filter(msg => msg.role === 'assistant').length,
        systemMessages: conversationHistory.filter(msg => msg.role === 'system').length
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

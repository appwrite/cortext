import { Client, Databases, ID, Permission, Role, Query } from 'appwrite';
import { Client as ServerClient, Databases as ServerDatabases, ID as ServerID, Permission as ServerPermission, Role as ServerRole, Query as ServerQuery } from 'node-appwrite';
import { Mastra, OpenAICompatibleModel } from '@mastra/core';

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

// Debug environment variables at module level
console.log('Module level - OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY);
console.log('Module level - All env vars:', Object.keys(process.env).sort());

// Initialize OpenAI model
const openaiModel = new OpenAICompatibleModel({
  id: 'openai/gpt-4o-mini',
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Mastra
const mastra = new Mastra({
  name: 'cortext-agent',
});

// Optimized system prompt for token caching and cost reduction
const SYSTEM_PROMPT = `You are Cortext, an AI writing assistant specialized in helping users create, edit, and improve blog content. You excel at:

- Content creation and editing
- SEO optimization
- Writing style improvements
- Research and fact-checking
- Audience engagement strategies
- Content structure and organization

Key guidelines:
- Be concise but helpful
- Focus on actionable advice
- Maintain a professional yet friendly tone
- Ask clarifying questions when needed
- Provide specific, implementable suggestions

Context: You're assisting with blog content creation and editing.`;

// Set up the client with environment variables
const endpoint = process.env.APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_PROJECT_ID;

if (!endpoint) {
  throw new Error('APPWRITE_ENDPOINT environment variable is required');
}

if (!projectId) {
  throw new Error('APPWRITE_PROJECT_ID environment variable is required');
}

// Validate OpenAI API key
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
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

    // Function to generate streaming LLM response and update database in real-time
    async function generateStreamingLLMResponse(messages, agentId, blogId, messageUserId) {
      // Initialize debug logging at function level
      let debugLogs = [];
      const addDebugLog = (message) => {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}`;
        debugLogs.push(logEntry);
        log(message); // Still log to console
      };

      // Helper function to create metadata within 2000 char limit
      const createMetadata = (baseData, maxLogs = 5, maxLogLength = 80) => {
        const metadata = {
          ...baseData,
          debugLogs: debugLogs.slice(-maxLogs).map(log => log.substring(0, maxLogLength))
        };
        
        let metadataString = JSON.stringify(metadata);
        if (metadataString.length > 2000) {
          // Reduce logs further if still too long
          metadata.debugLogs = debugLogs.slice(-3).map(log => log.substring(0, 50));
          metadataString = JSON.stringify(metadata);
        }
        
        return metadataString;
      };

      try {
        // Prepare conversation messages for the LLM in the format expected by Mastra
        // Filter out messages with null, undefined, or empty content
        const originalMessageCount = messages.length;
        const conversationMessages = messages
          .filter(msg => {
            // Check if content exists and is not null/undefined
            if (!msg.content) return false;
            // Check if content is a string and not empty
            if (typeof msg.content === 'string' && msg.content.trim().length > 0) return true;
            // Check if content is an object with text property
            if (typeof msg.content === 'object' && msg.content.text && msg.content.text.trim().length > 0) return true;
            return false;
          })
          .map(msg => ({
            role: msg.role,
            content: [{ type: 'text', text: typeof msg.content === 'string' ? msg.content : msg.content.text }]
          }));
        
        addDebugLog(`Filtered messages: ${originalMessageCount} -> ${conversationMessages.length} (removed ${originalMessageCount - conversationMessages.length} empty/null messages)`);

        // Limit conversation history to prevent token limit issues (keep last 50 messages)
        const limitedConversationMessages = conversationMessages.slice(-50);
        if (conversationMessages.length > 50) {
          addDebugLog(`Limited conversation to last 50 messages (was ${conversationMessages.length})`);
        }

        // Add system prompt at the beginning for context
        const messagesWithSystem = [
          { role: 'system', content: [{ type: 'text', text: SYSTEM_PROMPT }] },
          ...limitedConversationMessages
        ];

        // Create initial message document for streaming
        const initialMessage = await serverDatabases.createDocument(
          databaseId,
          'messages',
          ServerID.unique(),
          {
            conversationId,
            content: '', // Start with empty content
            role: 'assistant',
            userId: messageUserId || null,
            agentId: agentId || 'cortext-agent',
            blogId,
            metadata: JSON.stringify({
              model: 'gpt-4o-mini',
              temperature: 0.7,
              generatedAt: new Date().toISOString(),
              streaming: true,
              status: 'generating'
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

        log('Created initial streaming message with ID: ' + initialMessage.$id);

        // Check API key availability with fallbacks
        let apiKey = process.env.OPENAI_API_KEY || 
                    process.env.OPENAI_KEY || 
                    process.env.OPENAI_API_TOKEN ||
                    process.env.OPENAI_TOKEN;
        
        addDebugLog('OpenAI API Key present: ' + (apiKey ? 'Yes (length: ' + apiKey.length + ')' : 'No'));
        addDebugLog('Environment variables available: ' + Object.keys(process.env).filter(key => key.includes('OPENAI')).join(', '));
        addDebugLog('All environment variables: ' + Object.keys(process.env).sort().join(', '));
        
        if (!apiKey) {
          throw new Error('OPENAI_API_KEY environment variable is not set. Available env vars: ' + Object.keys(process.env).join(', '));
        }

        // Use OpenAI model to generate streaming response
        addDebugLog('Calling OpenAI model with ' + messagesWithSystem.length + ' messages (1 system + ' + limitedConversationMessages.length + ' conversation)');
        addDebugLog('Message format: ' + JSON.stringify(messagesWithSystem[0], null, 2));
        
        // Create a new model instance with the verified API key
        const dynamicOpenaiModel = new OpenAICompatibleModel({
          id: 'openai/gpt-4o-mini',
          apiKey: apiKey,
        });

        const streamParams = {
          prompt: messagesWithSystem,
          temperature: 0.7,
          max_tokens: 1000
        };
        
        addDebugLog('Stream parameters: ' + JSON.stringify(streamParams, null, 2));
        
        const streamResult = await dynamicOpenaiModel.doStream(streamParams);
        addDebugLog('OpenAI stream result received, starting to process...');

        // Check if stream exists
        if (!streamResult || !streamResult.stream) {
          throw new Error('No stream received from OpenAI model');
        }

        let fullContent = '';
        let chunkCount = 0;
        let streamTimeout;
        let streamCompleted = false;
        let lastChunkTime = Date.now();
        let inactivityTimeout;

        // Set a timeout for the streaming operation (5 minutes total)
        // This is generous enough for complex content generation
        streamTimeout = setTimeout(() => {
          if (!streamCompleted) {
            addDebugLog('Streaming timeout reached after 5 minutes, forcing completion');
            streamCompleted = true;
          }
        }, 300000); // 5 minutes = 300,000ms

        // Set an inactivity timeout (2 minutes without new chunks)
        // This prevents hanging on streams that stop sending data
        const resetInactivityTimeout = () => {
          clearTimeout(inactivityTimeout);
          inactivityTimeout = setTimeout(() => {
            if (!streamCompleted) {
              addDebugLog('No chunks received for 2 minutes, forcing completion due to inactivity');
              streamCompleted = true;
            }
          }, 120000); // 2 minutes = 120,000ms
        };
        resetInactivityTimeout();

        addDebugLog('Starting to process streaming chunks... (5min total timeout, 2min inactivity timeout)');

        try {
          // Process streaming chunks
          for await (const chunk of streamResult.stream) {
            if (streamCompleted) {
              addDebugLog('Stream completed due to timeout, breaking loop');
              break;
            }
            
            addDebugLog(`Processing chunk ${chunkCount + 1}, chunk type: ${chunk.type || 'unknown'}`);
            
            if (chunk.choices && chunk.choices[0] && chunk.choices[0].delta && chunk.choices[0].delta.content) {
              const content = chunk.choices[0].delta.content;
              fullContent += content;
              chunkCount++;
              lastChunkTime = Date.now();
              resetInactivityTimeout(); // Reset inactivity timeout when we receive content
              addDebugLog(`Received content chunk: "${content}" (total length: ${fullContent.length})`);

              // Update the message document with accumulated content every few chunks
              if (chunkCount % 3 === 0 || content.includes('\n')) {
                try {
                  await serverDatabases.updateDocument(
                    databaseId,
                    'messages',
                    initialMessage.$id,
                    {
                      content: fullContent,
                      metadata: createMetadata({
                        model: 'gpt-4o-mini',
                        temperature: 0.7,
                        generatedAt: new Date().toISOString(),
                        streaming: true,
                        status: 'generating',
                        chunkCount: chunkCount,
                        tokensUsed: fullContent.length
                      }, 5, 100)
                    }
                  );
                  addDebugLog(`Updated streaming message with ${chunkCount} chunks, content length: ${fullContent.length}`);
                } catch (updateError) {
                  addDebugLog('Error updating streaming message: ' + updateError.message);
                  // Continue streaming even if update fails
                }
              }
            } else if (chunk.type === 'error') {
              addDebugLog('Stream error received: ' + (chunk.error || 'Unknown error'));
              break;
            } else if (chunk.type === 'finish') {
              addDebugLog('Stream finished normally');
              break;
            }
          }
        } catch (streamError) {
          addDebugLog('Error processing stream: ' + streamError.message);
          // Continue with what we have so far
        }

        // Clear the timeouts and mark as completed
        clearTimeout(streamTimeout);
        clearTimeout(inactivityTimeout);
        streamCompleted = true;
        addDebugLog(`Stream processing completed. Total chunks: ${chunkCount}, Content length: ${fullContent.length}`);

        // If no content was received, provide a fallback
        if (!fullContent || fullContent.trim().length === 0) {
          addDebugLog('No content received from stream, using fallback message');
          fullContent = "I apologize, but I'm having trouble generating a response right now. Please try again.";
        }

        // Final update with complete content and truncated debug logs
        await serverDatabases.updateDocument(
          databaseId,
          'messages',
          initialMessage.$id,
          {
            content: fullContent,
            metadata: createMetadata({
              model: 'gpt-4o-mini',
              temperature: 0.7,
              generatedAt: new Date().toISOString(),
              streaming: false,
              status: 'completed',
              chunkCount: chunkCount,
              tokensUsed: fullContent.length,
              cached: true
            }, 10, 80)
          }
        );

        log(`Streaming completed. Final content length: ${fullContent.length}, chunks: ${chunkCount}`);

        return {
          messageId: initialMessage.$id,
          content: fullContent,
          chunkCount: chunkCount
        };

      } catch (error) {
        log('LLM streaming error: ' + error.message);
        
        // Add error to debug logs
        addDebugLog(`ERROR: ${error.message}`);
        
        // Create fallback message if streaming fails
        const fallbackContent = "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.";
        
        const fallbackMessage = await serverDatabases.createDocument(
          databaseId,
          'messages',
          ServerID.unique(),
          {
            conversationId,
            content: fallbackContent,
            role: 'assistant',
            userId: messageUserId || null,
            agentId: agentId || 'cortext-agent',
            blogId,
            metadata: createMetadata({
              model: 'gpt-4o-mini',
              temperature: 0.7,
              generatedAt: new Date().toISOString(),
              streaming: false,
              status: 'error',
              error: error.message.substring(0, 200)
            }, 5, 80),
            isEdited: false
          },
          [
            ...(messageUserId ? [
              ServerPermission.read(ServerRole.user(messageUserId))
            ] : [])
          ]
        );

        return {
          messageId: fallbackMessage.$id,
          content: fallbackContent,
          chunkCount: 0
        };
      }
    }

    // Load conversation history for LLM context using server SDK
    log('Loading conversation history for conversation: ' + conversationId);
    const conversationMessages = await serverDatabases.listDocuments(
      databaseId,
      'messages',
      [
        ServerQuery.equal('conversationId', conversationId),
        ServerQuery.orderAsc('$createdAt'),
        ServerQuery.limit(200)
      ]
    );

    log(`Found ${conversationMessages.total} messages in conversation`);

    // Generate streaming LLM response and update database in real-time
    const streamingResult = await generateStreamingLLMResponse(
      conversationMessages.documents, 
      agentId, 
      blogId, 
      messageUserId
    );
    
    log(`Streaming completed. Message ID: ${streamingResult.messageId}, Content length: ${streamingResult.content.length}, Chunks: ${streamingResult.chunkCount}`);

    // Get the final message document
    const message = await serverDatabases.getDocument(
      databaseId,
      'messages',
      streamingResult.messageId
    );

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

    // Return success response with conversation history and streaming info
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
      streamingInfo: {
        messageId: streamingResult.messageId,
        chunkCount: streamingResult.chunkCount,
        contentLength: streamingResult.content.length,
        streaming: false, // Completed
        status: 'completed'
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

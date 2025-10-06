import { Client, Databases, ID, Permission, Role, Query } from 'appwrite';
import { Client as ServerClient, Databases as ServerDatabases, ID as ServerID, Permission as ServerPermission, Role as ServerRole, Query as ServerQuery } from 'node-appwrite';
import { Mastra } from '@mastra/core';
import { openai } from '@mastra/openai';

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

// Initialize Mastra with OpenAI
const mastra = new Mastra({
  name: 'cortext-agent',
  llms: {
    openai: openai({
      apiKey: process.env.OPENAI_API_KEY,
    }),
  },
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
      try {
        // Prepare conversation messages for the LLM
        const conversationMessages = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        // Add system prompt at the beginning for context
        const messagesWithSystem = [
          { role: 'system', content: SYSTEM_PROMPT },
          ...conversationMessages
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

        // Use Mastra to generate streaming response with OpenAI
        const stream = await mastra.llm('openai').generateStream({
          messages: messagesWithSystem,
          model: 'gpt-4o-mini',
          temperature: 0.7,
          max_tokens: 1000,
          cache: true,
          context: {
            blogId: blogId,
            agentId: agentId,
            conversationLength: messages.length
          }
        });

        let fullContent = '';
        let chunkCount = 0;

        // Process streaming chunks
        for await (const chunk of stream) {
          if (chunk.choices && chunk.choices[0] && chunk.choices[0].delta && chunk.choices[0].delta.content) {
            const content = chunk.choices[0].delta.content;
            fullContent += content;
            chunkCount++;

            // Update the message document with accumulated content every few chunks
            if (chunkCount % 3 === 0 || content.includes('\n')) {
              try {
                await serverDatabases.updateDocument(
                  databaseId,
                  'messages',
                  initialMessage.$id,
                  {
                    content: fullContent,
                    metadata: JSON.stringify({
                      model: 'gpt-4o-mini',
                      temperature: 0.7,
                      generatedAt: new Date().toISOString(),
                      streaming: true,
                      status: 'generating',
                      chunkCount: chunkCount,
                      tokensUsed: fullContent.length
                    })
                  }
                );
                log(`Updated streaming message with ${chunkCount} chunks, content length: ${fullContent.length}`);
              } catch (updateError) {
                log('Error updating streaming message: ' + updateError.message);
                // Continue streaming even if update fails
              }
            }
          }
        }

        // Final update with complete content
        await serverDatabases.updateDocument(
          databaseId,
          'messages',
          initialMessage.$id,
          {
            content: fullContent,
            metadata: JSON.stringify({
              model: 'gpt-4o-mini',
              temperature: 0.7,
              generatedAt: new Date().toISOString(),
              streaming: false,
              status: 'completed',
              chunkCount: chunkCount,
              tokensUsed: fullContent.length,
              cached: true
            })
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
            metadata: JSON.stringify({
              model: 'gpt-4o-mini',
              temperature: 0.7,
              generatedAt: new Date().toISOString(),
              streaming: false,
              status: 'error',
              error: error.message
            }),
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

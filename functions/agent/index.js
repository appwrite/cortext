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

// Environment variables are loaded at module level

// Initialize OpenAI model
const openaiModel = new OpenAICompatibleModel({
  id: 'openai/gpt-5',
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Mastra
const mastra = new Mastra({
  name: 'cortext-agent',
});

// Optimized system prompt for token caching and cost reduction
const SYSTEM_PROMPT = `You are Cortext, a professional AI writing assistant specializing in high-quality blog content creation and editing.

CRITICAL INSTRUCTION: When users ask you to change or update anything, you MUST respond with a JSON object containing the changes, followed by a brief explanation. This is not optional - it's required for the system to work.

MANDATORY JSON FORMAT:
Your response must start with a JSON object containing the changes, then a newline, then your explanation.

EXAMPLES:
- User: "Change the title to X" → You: '{"article": {"title": "X"}}\n\nUpdated the title to X.'
- User: "Update the subtitle" → You: '{"article": {"subtitle": "New Subtitle"}}\n\nUpdated the subtitle.'
- User: "Make it published" → You: '{"article": {"status": "published"}}\n\nStatus changed to published.'
- User: "Add a new section" → You: '{"sections": [{"type": "text", "content": "Your new content here", "id": "new"}]}\n\nAdded new text section.'

JSON STRUCTURE:
- For article changes: {"article": {"field": "value"}}
- For section changes: {"sections": [{"type": "text|title|quote|code|image", "content": "content", "id": "id", "action": "create|update|delete|move", "position": 0}]}
- For multiple changes: {"article": {...}, "sections": [...]}

SECTION ACTIONS:
- create: Create a new section (use id: "new" for auto-generated ID)
- update: Update existing section content
- delete: Remove a section
- move: Move section to different position

POSITIONING:
- position: 0-based index where to insert/move section
- targetId: ID of section to move relative to

You excel at:
- Professional content creation and editing
- SEO optimization and keyword strategy
- Writing style refinement
- Research and fact-checking
- Audience engagement strategies
- Content structure and organization

Key guidelines:
- Write with journalistic precision and clarity
- Use concise, professional language
- Avoid over-explanation - be direct and actionable
- Always use normal hyphens (-) not en-dashes or em-dashes
- Maintain authoritative yet accessible tone
- Focus on substance over style
- Provide specific, implementable suggestions
- ALWAYS start with valid JSON for ANY changes

Context: You're assisting with professional blog content creation and editing.`;

// Token-cache friendly article context builder
function buildArticleContext(article, maxTokens = 2000) {
    if (!article) return '';
    
    const context = {
        title: article.title || 'Untitled',
        trailer: article.trailer || '',
        subtitle: article.subtitle || '',
        status: article.status || 'unpublished',
        live: article.live || false,
        pinned: article.pinned || false,
        redirect: article.redirect || '',
        slug: article.slug || '',
        authors: article.authors || [],
        categories: article.categories || [],
        images: article.images || [],
        sections: []
    };
    
    // Parse and summarize sections for token efficiency
    if (article.body) {
        try {
            const sections = JSON.parse(article.body);
            context.sections = sections.map(section => ({
                type: section.type,
                content: section.content ? section.content.substring(0, 200) : '', // Truncate for token efficiency
                id: section.id
            }));
        } catch (e) {
            // If parsing fails, treat as plain text
            context.sections = [{
                type: 'text',
                content: article.body.substring(0, 200),
                id: 'legacy'
            }];
        }
    }
    
    // Build compact context string
    let contextStr = `Article: "${context.title}"\n`;
    if (context.trailer) contextStr += `Trailer: "${context.trailer}"\n`;
    if (context.subtitle) contextStr += `Subtitle: "${context.subtitle}"\n`;
    contextStr += `Status: ${context.status} | Live: ${context.live}\n`;
    if (context.slug) contextStr += `Slug: ${context.slug}\n`;
    if (context.redirect) contextStr += `Redirect: ${context.redirect}\n`;
    if (context.authors.length > 0) contextStr += `Authors: ${context.authors.join(', ')}\n`;
    if (context.categories.length > 0) contextStr += `Categories: ${context.categories.join(', ')}\n`;
    if (context.images.length > 0) contextStr += `Images: ${context.images.length} image(s)\n`;
    
    if (context.sections.length > 0) {
        contextStr += `Sections:\n`;
        context.sections.forEach((section, i) => {
            contextStr += `${i + 1}. ${section.type}: ${section.content}\n`;
        });
    }
    
    // Truncate if too long
    if (contextStr.length > maxTokens) {
        contextStr = contextStr.substring(0, maxTokens - 50) + '...';
    }
    
    return contextStr;
}

// Enhanced system prompt with article context
function buildSystemPrompt(articleContext) {
    const basePrompt = SYSTEM_PROMPT;
    
    if (articleContext) {
        return `${basePrompt}

Current Article Context:
${articleContext}

You can help edit this article by providing specific instructions. When you want to make changes, you MUST use the JSON format described above.

Available article fields for JSON:
- title: Article title (string)
- trailer: Article trailer/teaser (string)
- subtitle: Article subtitle/description (string)
- status: Article status (draft, unpublished, published)
- live: Live status (true/false)
- pinned: Pinned status (true/false)
- redirect: Redirect URL (string)
- slug: Article slug (string)
- authors: Author IDs (array of strings)
- categories: Category IDs (array of strings)

Available section types for JSON:
- text: Plain text content
- title: Section title
- quote: Quoted text
- code: Code block
- image: Image with caption

MANDATORY JSON EXAMPLES:
{"article": {"title": "New Article Title"}}
{"article": {"subtitle": "Updated subtitle text"}}
{"article": {"status": "published"}}
{"article": {"authors": ["author1", "author2"]}}

// Section examples:
{"sections": [{"type": "text", "content": "New paragraph content", "id": "section1", "action": "update"}]}
{"sections": [{"type": "title", "content": "New Section Title", "id": "new", "action": "create"}]}
{"sections": [{"type": "code", "content": "console.log('Hello World');", "id": "section3", "action": "update"}]}

// Positioning examples:
{"sections": [{"type": "text", "content": "Insert at beginning", "id": "new", "action": "create", "position": 0}]}
{"sections": [{"type": "text", "content": "Insert at position 2", "id": "new", "action": "create", "position": 2}]}
{"sections": [{"type": "text", "id": "section1", "action": "move", "position": 0}]}
{"sections": [{"type": "text", "id": "section1", "action": "move", "targetId": "section3"}]}
{"sections": [{"type": "text", "id": "section1", "action": "delete"}]}

// Multiple changes:
{"article": {"title": "New Title"}, "sections": [{"type": "text", "content": "New content", "id": "new", "action": "create"}]}

When the user asks you to change something, respond with the JSON format immediately, followed by a brief explanation. For example:
User: "Change the title to 'My New Title'"
You: '{"article": {"title": "My New Title"}}

Updated the title to 'My New Title'.'

REMEMBER: You MUST use the JSON format for ALL changes. Start with valid JSON, then add your explanation.`;
    }
    
    return basePrompt + `

You can help edit articles by providing specific instructions. When you want to make changes, you MUST use the JSON format described above.

Available article fields for JSON:
- title: Article title (string)
- trailer: Article trailer/teaser (string)
- subtitle: Article subtitle/description (string)
- status: Article status (draft, unpublished, published)
- live: Live status (true/false)
- pinned: Pinned status (true/false)
- redirect: Redirect URL (string)
- slug: Article slug (string)
- authors: Author IDs (array of strings)
- categories: Category IDs (array of strings)

When the user asks you to change something, respond with the JSON format immediately, followed by a brief explanation.

REMEMBER: You MUST use the JSON format for ALL changes. Start with valid JSON, then add your explanation.`;
}

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

    const { conversationId, agentId, blogId, metadata, articleId } = body;

    log('Request body fields: ' + JSON.stringify({ conversationId, agentId, blogId, articleId, metadata }));

    // Get database ID from environment
    const databaseId = process.env.APPWRITE_DATABASE_ID;
    
    if (!databaseId) {
      return res.json({
        success: false,
        error: 'APPWRITE_DATABASE_ID environment variable is required'
      }, 500);
    }

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

    // Load article context if articleId is provided
    let articleContext = '';
    if (articleId) {
      try {
        log('Loading article context for articleId: ' + articleId);
        const article = await serverDatabases.getDocument(databaseId, 'articles', articleId);
        log('Article loaded: ' + JSON.stringify({
          id: article.$id,
          title: article.title,
          subtitle: article.subtitle,
          status: article.status
        }));
        articleContext = buildArticleContext(article);
        log('Article context loaded: ' + (articleContext ? 'Yes' : 'No'));
        log('Article context preview: ' + articleContext.substring(0, 200) + '...');
      } catch (error) {
        log('Failed to load article context: ' + error.message);
        // Continue without article context
      }
    } else {
      log('No articleId provided, skipping article context loading');
    }

    // If using JWT authentication, userId should be available from the token
    if (jwtToken && !messageUserId) {
      return res.json({
        success: false,
        error: 'User authentication required. Please ensure you are logged in.'
      }, 401);
    }

    // Function to generate streaming LLM response and update database in real-time
    async function generateStreamingLLMResponse(messages, agentId, blogId, messageUserId, articleContext, revisionId, articleId) {
      // Track generation start time
      const generationStartTime = Date.now();
      
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
        const systemPrompt = buildSystemPrompt(articleContext);
        addDebugLog(`System prompt length: ${systemPrompt.length}`);
        addDebugLog(`Article context: ${articleContext ? 'Yes' : 'No'}`);
        addDebugLog(`System prompt preview: ${systemPrompt.substring(0, 200)}...`);
        
        const messagesWithSystem = [
          { role: 'system', content: [{ type: 'text', text: systemPrompt }] },
          ...limitedConversationMessages
        ];

        // Create initial message document for streaming
        const initialMessage = await serverDatabases.createDocument(
          databaseId,
          'messages',
          ServerID.unique(),
          {
            conversationId,
            content: 'Thinking...', // Start with a visual indicator
            role: 'assistant',
            userId: messageUserId || null,
            agentId: agentId || 'cortext-agent',
            blogId,
            metadata: createMetadata({
              model: 'gpt-5',
              temperature: 0.7,
              generatedAt: new Date().toISOString(),
              streaming: true,
              status: 'generating',
              chunkCount: 0,
              tokensUsed: 0
            }, 5, 100),
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
          id: 'openai/gpt-5',
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
            addDebugLog(`Chunk structure: ${JSON.stringify(chunk, null, 2)}`);
            
            // Handle different chunk types from Mastra stream
            if (chunk.type === 'text-delta' && chunk.delta) {
              const content = chunk.delta;
              fullContent += content;
              chunkCount++;
              lastChunkTime = Date.now();
              resetInactivityTimeout(); // Reset inactivity timeout when we receive content
              addDebugLog(`Received content chunk: "${content}" (total length: ${fullContent.length})`);

              // Update the message document with accumulated content for streaming effect
              // Update every 2 chunks or on newlines for better performance while maintaining streaming feel
              if (chunkCount % 2 === 0 || content.includes('\n') || content.includes('.')) {
                try {
                  await serverDatabases.updateDocument(
                    databaseId,
                    'messages',
                    initialMessage.$id,
                    {
                      content: fullContent,
                      metadata: createMetadata({
                        model: 'gpt-5',
                        temperature: 0.7,
                        generatedAt: new Date().toISOString(),
                        streaming: true,
                        status: 'generating',
                        chunkCount: chunkCount,
                        tokensUsed: fullContent.length,
                        lastChunkAt: new Date().toISOString()
                      }, 5, 100)
                    }
                  );
                  addDebugLog(`Updated streaming message with ${chunkCount} chunks, content length: ${fullContent.length}`);
                } catch (updateError) {
                  addDebugLog('Error updating streaming message: ' + updateError.message);
                  // Continue streaming even if update fails
                }
              }
            } else if (chunk.type === 'text-delta' && chunk.content) {
              // Alternative format where content is directly in chunk
              const content = chunk.content;
              fullContent += content;
              chunkCount++;
              lastChunkTime = Date.now();
              resetInactivityTimeout();
              addDebugLog(`Received content chunk (alt format): "${content}" (total length: ${fullContent.length})`);

              // Update the message document with accumulated content for streaming effect
              // Update every 2 chunks or on newlines for better performance while maintaining streaming feel
              if (chunkCount % 2 === 0 || content.includes('\n') || content.includes('.')) {
                try {
                  await serverDatabases.updateDocument(
                    databaseId,
                    'messages',
                    initialMessage.$id,
                    {
                      content: fullContent,
                      metadata: createMetadata({
                        model: 'gpt-5',
                        temperature: 0.7,
                        generatedAt: new Date().toISOString(),
                        streaming: true,
                        status: 'generating',
                        chunkCount: chunkCount,
                        tokensUsed: fullContent.length,
                        lastChunkAt: new Date().toISOString()
                      }, 5, 100)
                    }
                  );
                  addDebugLog(`Updated streaming message with ${chunkCount} chunks, content length: ${fullContent.length}`);
                } catch (updateError) {
                  addDebugLog('Error updating streaming message: ' + updateError.message);
                  // Continue streaming even if update fails
                }
              }
            } else if (chunk.choices && chunk.choices[0] && chunk.choices[0].delta && chunk.choices[0].delta.content) {
              // Fallback to original OpenAI format
              const content = chunk.choices[0].delta.content;
              fullContent += content;
              chunkCount++;
              lastChunkTime = Date.now();
              resetInactivityTimeout();
              addDebugLog(`Received content chunk (OpenAI format): "${content}" (total length: ${fullContent.length})`);

              // Update the message document with accumulated content for streaming effect
              // Update every 2 chunks or on newlines for better performance while maintaining streaming feel
              if (chunkCount % 2 === 0 || content.includes('\n') || content.includes('.')) {
                try {
                  await serverDatabases.updateDocument(
                    databaseId,
                    'messages',
                    initialMessage.$id,
                    {
                      content: fullContent,
                      metadata: createMetadata({
                        model: 'gpt-5',
                        temperature: 0.7,
                        generatedAt: new Date().toISOString(),
                        streaming: true,
                        status: 'generating',
                        chunkCount: chunkCount,
                        tokensUsed: fullContent.length,
                        lastChunkAt: new Date().toISOString()
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
              streamCompleted = true;
              break;
            } else if (chunk.type === 'finish') {
              addDebugLog('Stream finished normally - waiting for final content');
              // Don't break immediately, wait for potential final content
              // Set a short timeout to allow for final content
              setTimeout(() => {
                if (!streamCompleted) {
                  addDebugLog('No more content after finish signal, completing stream');
                  streamCompleted = true;
                }
              }, 1000); // Wait 1 second for final content
            } else if (chunk.type === 'text-end') {
              addDebugLog('Text stream ended - waiting for final content');
              // Don't break immediately, wait for potential final content
              // Set a short timeout to allow for final content
              setTimeout(() => {
                if (!streamCompleted) {
                  addDebugLog('No more content after text-end signal, completing stream');
                  streamCompleted = true;
                }
              }, 1000); // Wait 1 second for final content
            } else {
              addDebugLog(`Unhandled chunk type: ${chunk.type}, chunk: ${JSON.stringify(chunk)}`);
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

        // Calculate total generation time
        const generationTimeMs = Date.now() - generationStartTime;
        addDebugLog(`Total generation time: ${generationTimeMs}ms`);

        // Add a small delay to ensure all content is processed
        await new Promise(resolve => setTimeout(resolve, 500));

        // Parse LLM response for article updates and create new revision
        let newRevisionId = null;
        addDebugLog(`Revision creation check - revisionId: ${revisionId}, articleId: ${articleId}, fullContent length: ${fullContent?.length || 0}`);
        
        if (revisionId && articleId && fullContent) {
          try {
            addDebugLog('Parsing LLM response for article updates...');
            
            // Extract JSON from the response (look for JSON at the beginning)
            const jsonMatch = fullContent.match(/^\{[\s\S]*?\}\n/);
            if (jsonMatch) {
              const jsonStr = jsonMatch[0].trim();
              addDebugLog(`Found JSON in response: ${jsonStr.substring(0, 200)}...`);
              
              const updates = JSON.parse(jsonStr);
              addDebugLog(`Parsed updates: ${JSON.stringify(updates)}`);
              
              // Get current article and revision
              const currentArticle = await serverDatabases.getDocument(databaseId, 'articles', articleId);
              const currentRevision = await serverDatabases.getDocument(databaseId, 'revisions', revisionId);
              
              addDebugLog(`Current article: ${currentArticle.title}`);
              addDebugLog(`Current revision version: ${currentRevision.version}`);
              
              // Get team ID from the blog for proper permissions
              let teamId = null;
              if (currentArticle.blogId) {
                try {
                  const blog = await serverDatabases.getDocument(databaseId, 'blogs', currentArticle.blogId);
                  teamId = blog.teamId;
                  addDebugLog(`Found team ID: ${teamId}`);
                } catch (blogError) {
                  addDebugLog(`Failed to get blog ${currentArticle.blogId}: ${blogError.message}`);
                }
              }
              
              // Parse current revision data
              const currentRevisionData = currentRevision.data ? JSON.parse(currentRevision.data) : {};
              const currentAttributes = currentRevisionData.attributes || currentRevisionData;
              
              // Create updated article data
              const updatedArticle = { ...currentArticle };
              
              // Initialize sections from current revision data
              let sections = currentAttributes.sections || [];
              
              // Apply article-level updates
              if (updates.article) {
                Object.keys(updates.article).forEach(key => {
                  updatedArticle[key] = updates.article[key];
                });
                addDebugLog(`Applied article updates: ${JSON.stringify(updates.article)}`);
              }
              
              // Apply section updates
              if (updates.sections) {
                updates.sections.forEach(update => {
                  switch (update.action) {
                    case 'create':
                      const newId = update.id === 'new' ? ServerID.unique() : update.id;
                      const newSection = {
                        type: update.type,
                        content: update.content,
                        id: newId
                      };
                      
                      if (update.position !== undefined) {
                        sections.splice(update.position, 0, newSection);
                      } else {
                        sections.push(newSection);
                      }
                      addDebugLog(`Created new section: ${update.type} at position ${update.position || 'end'}`);
                      break;
                      
                    case 'update':
                      const updateIndex = sections.findIndex(s => s.id === update.id);
                      if (updateIndex !== -1) {
                        sections[updateIndex] = { ...sections[updateIndex], ...update };
                        addDebugLog(`Updated section ${update.id}`);
                      }
                      break;
                      
                    case 'delete':
                      sections = sections.filter(s => s.id !== update.id);
                      addDebugLog(`Deleted section ${update.id}`);
                      break;
                      
                    case 'move':
                      const moveIndex = sections.findIndex(s => s.id === update.id);
                      if (moveIndex !== -1) {
                        const [movedSection] = sections.splice(moveIndex, 1);
                        if (update.position !== undefined) {
                          sections.splice(update.position, 0, movedSection);
                        } else if (update.targetId) {
                          const targetIndex = sections.findIndex(s => s.id === update.targetId);
                          sections.splice(targetIndex, 0, movedSection);
                        }
                        addDebugLog(`Moved section ${update.id}`);
                      }
                      break;
                  }
                });
                
                updatedArticle.body = JSON.stringify(sections);
                addDebugLog(`Updated sections, new count: ${sections.length}`);
              }
              
              // Create new revision
              const currentRevisions = await serverDatabases.listDocuments(
                databaseId,
                'revisions',
                [
                  ServerQuery.equal('articleId', articleId),
                  ServerQuery.orderDesc('version'),
                  ServerQuery.limit(1)
                ]
              );
              
              const nextVersion = currentRevisions.documents.length > 0 
                ? currentRevisions.documents[0].version + 1 
                : 1;
              
              const newRevisionData = {
                articleId: articleId,
                version: nextVersion,
                status: 'draft',
                createdBy: agentId || 'cortext-agent',
                userId: agentId || 'cortext-agent',
                userName: 'Cortext AI Agent',
                userEmail: 'ai@cortext.app',
                messageId: initialMessage.$id,
                data: JSON.stringify({
                  initial: false,
                  title: updatedArticle.title,
                  subtitle: updatedArticle.subtitle,
                  trailer: updatedArticle.trailer,
                  status: updatedArticle.status,
                  live: updatedArticle.live,
                  pinned: updatedArticle.pinned,
                  redirect: updatedArticle.redirect,
                  slug: updatedArticle.slug,
                  authors: updatedArticle.authors,
                  categories: updatedArticle.categories,
                  images: updatedArticle.images,
                  blogId: updatedArticle.blogId,
                  sections: sections,
                  changedAttributes: updates.article || {},
                  timestamp: new Date().toISOString()
                }),
                changes: [`AI-generated updates via message ${initialMessage.$id}`],
                parentRevisionId: revisionId
              };
              
              // Create permissions array for team access
              const permissions = teamId ? [
                ServerPermission.read(ServerRole.team(teamId)),
                ServerPermission.update(ServerRole.team(teamId)),
                ServerPermission.delete(ServerRole.team(teamId))
              ] : undefined;
              
              addDebugLog(`Creating revision with permissions: ${permissions ? 'team-based' : 'default'}`);
              
              const newRevision = await serverDatabases.createDocument(
                databaseId,
                'revisions',
                ServerID.unique(),
                newRevisionData,
                permissions
              );
              
              newRevisionId = newRevision.$id;
              addDebugLog(`Created new revision ${newRevisionId} (version ${nextVersion})`);
              
              // Update article's active revision ID
              await serverDatabases.updateDocument(databaseId, 'articles', articleId, {
                activeRevisionId: newRevisionId
              });
              
              addDebugLog(`Updated article activeRevisionId to ${newRevisionId}`);
              addDebugLog(`New revision ID to be saved in message: ${newRevisionId}`);
            } else {
              addDebugLog('No JSON found in LLM response, skipping revision creation');
              addDebugLog(`Full content preview: ${fullContent.substring(0, 200)}...`);
            }
          } catch (parseError) {
            addDebugLog(`Error parsing LLM response or creating revision: ${parseError.message}`);
            // Continue without creating revision
          }
        } else {
          addDebugLog(`Skipping revision creation - missing required data: revisionId=${!!revisionId}, articleId=${!!articleId}, fullContent=${!!fullContent}`);
        }

        // Final update with complete content, revision ID, and truncated debug logs
        addDebugLog(`Final message update - revisionId: ${newRevisionId}`);
        await serverDatabases.updateDocument(
          databaseId,
          'messages',
          initialMessage.$id,
          {
            content: fullContent,
            revisionId: newRevisionId, // This will be null if no revision was created
            generationTimeMs: generationTimeMs,
            metadata: createMetadata({
              model: 'gpt-5',
              temperature: 0.7,
              generatedAt: new Date().toISOString(),
              streaming: false,
              status: 'completed',
              chunkCount: chunkCount,
              tokensUsed: fullContent.length,
              completedAt: new Date().toISOString(),
              generationTimeMs: generationTimeMs,
              cached: true
            }, 10, 80)
          }
        );
        addDebugLog(`Message updated with revisionId: ${newRevisionId}`);

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
        
        // Calculate generation time even for error cases
        const generationTimeMs = Date.now() - generationStartTime;
        addDebugLog(`Generation failed after ${generationTimeMs}ms: ${error.message}`);
        
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
            revisionId: null, // No revision created for error cases
            generationTimeMs: generationTimeMs,
            metadata: createMetadata({
              model: 'gpt-5',
              temperature: 0.7,
              generatedAt: new Date().toISOString(),
              streaming: false,
              status: 'error',
              error: error.message.substring(0, 200),
              generationTimeMs: generationTimeMs
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

    // Get revisionId from the latest user message
    const latestUserMessage = conversationMessages.documents
      .filter(msg => msg.role === 'user')
      .pop(); // Get the last user message
    const revisionId = latestUserMessage?.revisionId || null;
    
    log(`Revision ID from latest user message: ${revisionId || 'None'}`);

    // Generate streaming LLM response and update database in real-time
    const streamingResult = await generateStreamingLLMResponse(
      conversationMessages.documents, 
      agentId, 
      blogId, 
      messageUserId,
      articleContext,
      revisionId,
      articleId
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

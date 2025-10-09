import { Client, Databases, ID, Permission, Role, Query } from 'appwrite';
import { Client as ServerClient, Databases as ServerDatabases, ID as ServerID, Permission as ServerPermission, Role as ServerRole, Query as ServerQuery } from 'node-appwrite';
import { Mastra, OpenAICompatibleModel } from '@mastra/core';

/**
 * Agent Function Architecture:
 * - Uses client SDK with JWT token for user authentication and verification
 * - Uses server SDK with dynamic API key for all database write operations
 * - This provides better security by separating authentication from data operations
 * - Dynamic API key allows fine-grained permissions for server-side operations
 * 
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

NEVER ASK USERS FOR SECTION IDs: You have access to all section IDs in the article context. Always use the IDs provided in the context. Never ask users to provide section IDs or numbers.

MANDATORY JSON FORMAT:
Your response must start with a JSON object containing the changes, then a newline, then your explanation.

EXAMPLES:
- User: "Change the title to X" → You: '{"article": {"title": "X"}}\n\nUpdated the title to X.'
- User: "Update the subtitle" → You: '{"article": {"subtitle": "New Subtitle"}}\n\nUpdated the subtitle.'
- User: "Make it published" → You: '{"article": {"status": "published"}}\n\nStatus changed to published.'
- User: "Add a new section" → You: '{"sections": [{"type": "text", "content": "Your new content here", "id": "new"}]}\n\nAdded new text section.'

JSON STRUCTURE:
- For article changes: {"article": {"field": "value"}}
- For section changes: {"sections": [{"type": "text|title|quote|code|image|video|map", "content": "content", "id": "id", "action": "create|update|delete|move", "position": 0}]}
- For multiple changes: {"article": {...}, "sections": [...]}

SECTION ACTIONS:
- create: Create a new section (use id: "new" for auto-generated ID)
- update: Update existing section content (use exact section ID from context)
- delete: Remove a section (use exact section ID from context)
- move: Move section to different position (use exact section ID from context)

POSITIONING:
- position: 0-based index where to insert/move section
- targetId: ID of section to move relative to

DATA STRUCTURE KNOWLEDGE:

ARTICLES COLLECTION:
- title: Article title (string, max 1024 chars) - Main headline
- trailer: Article trailer/teaser (string, max 512 chars) - Short preview text
- subtitle: Article subtitle/description (string, max 2048 chars) - Longer description
- status: Article status (string, max 50 chars) - Values: 'draft', 'unpublished', 'published'
- live: Live status (boolean) - Whether article is publicly visible
- pinned: Pinned status (boolean) - Whether article is pinned/featured
- redirect: Redirect URL (string, max 500 chars) - URL to redirect to instead of article
- slug: Article slug (string, max 255 chars) - URL-friendly version of title
- authors: Author IDs (array of strings, max 512 chars each) - References to authors collection
- categories: Category IDs (array of strings, max 512 chars each) - References to categories collection
- images: Image URLs (array of strings, max 512 chars each) - References to images collection
- body: Article content (string, max 200000 chars) - JSON string containing sections array
- createdBy: Creator user ID (string, max 255 chars) - User who created the article
- activeRevisionId: Current active revision ID (string, max 255 chars) - Reference to revisions collection
- blogId: Blog ID (string, max 255 chars) - Reference to blogs collection

SECTIONS STRUCTURE (stored in body field as JSON):
Each section has:
- type: Section type - 'text', 'title', 'quote', 'code', 'image', 'video', 'map'
- content: Section content (string) - The actual text/code/content
- id: Unique section ID (string) - Used for updates/deletes/moves
- position: Position in article (number) - 0-based index
- title: Section title (string, optional) - For title sections
- speaker: Quote speaker (string, optional) - For quote sections
- imageIds: Array of image IDs (array of strings, optional) - For image sections
- mediaId: Single image ID (string, optional) - For backward compatibility with image sections
- embedUrl: Video URL (string, optional) - For video sections
- data: Additional data (string/object, optional) - For complex sections like maps/code
- language: Programming language (string, optional) - For code sections

SECTION TYPES AND THEIR PROPERTIES:

1. TITLE SECTION:
   - type: 'title'
   - content: The title text (string)
   - Properties: Simple text input for section headings

2. TEXT SECTION:
   - type: 'text' or 'paragraph'
   - content: Rich text content (string)
   - Properties: Multi-line textarea with auto-resize, supports markdown formatting

3. QUOTE SECTION:
   - type: 'quote'
   - content: The quoted text (string)
   - speaker: Who said the quote (string, optional)
   - Properties: Textarea for quote + input field for speaker attribution

4. IMAGE SECTION:
   - type: 'image'
   - imageIds: Array of selected image IDs (array of strings)
   - mediaId: First image ID for backward compatibility (string)
   - Properties: Image gallery selector, supports multiple images

5. VIDEO SECTION:
   - type: 'video'
   - embedUrl: YouTube/Vimeo URL (string)
   - Properties: URL input with YouTube/Vimeo validation and embed preview

6. MAP SECTION:
   - type: 'map'
   - data: JSON string with lat/lng coordinates (string)
   - Properties: Latitude/longitude inputs for location mapping

7. CODE SECTION:
   - type: 'code'
   - content: Code content (string)
   - language: Programming language (string, default: 'javascript')
   - data: JSON string with language info (string, optional)
   - Properties: Code editor with syntax highlighting and language selection

REVISIONS SYSTEM:
- Articles use a revision system for version control
- Each change creates a new revision with incremented version number
- activeRevisionId points to the current active revision
- Revisions contain full article snapshots in JSON format
- When you make changes, a new revision is automatically created

BLOGS COLLECTION:
- name: Blog name (string, max 255 chars, required)
- slug: Blog slug (string, max 255 chars, required, unique)
- description: Blog description (string, max 2048 chars)
- theme: Blog theme (string, max 100 chars, default: 'default')
- teamId: Team ID (string, max 255 chars, required) - References teams collection
- status: Blog status (string, max 50 chars, default: 'active')
- seoTitle: SEO title (string, max 512 chars)
- seoDescription: SEO description (string, max 1024 chars)
- seoKeywords: SEO keywords (array of strings, max 512 chars each)

RELATIONSHIPS:
- Articles belong to Blogs (via blogId)
- Blogs belong to Teams (via teamId)
- Articles have multiple Revisions (via activeRevisionId)
- Articles reference Authors, Categories, and Images (via arrays of IDs)

FIELD CONSTRAINTS TO REMEMBER:
- Title: Max 1024 characters
- Subtitle: Max 2048 characters
- Trailer: Max 512 characters
- Slug: Max 255 characters (must be URL-friendly)
- Redirect: Max 500 characters
- Author/Category/Image IDs: Max 512 characters each
- Body: Max 200000 characters (contains JSON sections)

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
- Intelligently identify relevant sections without asking for clarification
- Make reasonable assumptions based on available context to provide seamless user experience
- Respect field size limits and data constraints
- Understand the revision system - changes create new revisions automatically

Context: You're assisting with professional blog content creation and editing.`;

// Token-cache friendly article context builder
function buildArticleContext(article, maxTokens = 150000) {
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
    // Handle both main article structure (sections in body field) and revision structure (sections directly)
    let sections = [];
    
    if (article.sections && Array.isArray(article.sections)) {
        // Revision data structure - sections are stored directly
        sections = article.sections;
    } else if (article.body) {
        // Main article structure - sections are stored in body field as JSON
        try {
            sections = JSON.parse(article.body);
        } catch (e) {
            // If parsing fails, treat as plain text
            sections = [{
                type: 'text',
                content: article.body.substring(0, 2000),
                id: 'legacy'
            }];
        }
    }
    
    if (sections && sections.length > 0) {
        context.sections = sections.map(section => {
            const sectionData = {
                type: section.type,
                content: section.content ? section.content.substring(0, 5000) : '', // Increased to 5000 chars for full content
                id: section.id
            };
            
            // Include additional fields based on section type
            if (section.type === 'quote' && section.speaker) {
                sectionData.speaker = section.speaker;
            }
            
            if (section.type === 'code' && section.language) {
                sectionData.language = section.language;
            }
            
            if (section.type === 'image') {
                if (section.imageIds && section.imageIds.length > 0) {
                    sectionData.imageIds = section.imageIds;
                }
                if (section.mediaId) {
                    sectionData.mediaId = section.mediaId;
                }
            }
            
            if (section.type === 'video' && section.embedUrl) {
                sectionData.embedUrl = section.embedUrl;
            }
            
            if (section.type === 'map' && section.data) {
                sectionData.data = section.data;
            }
            
            return sectionData;
        });
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
        // First, show ALL section IDs and types for reference
        contextStr += `ALL SECTIONS (${context.sections.length} total):\n`;
        context.sections.forEach((section, i) => {
            contextStr += `${i + 1}. ${section.type} - ID: ${section.id}\n`;
        });
        
        // Then show detailed content for each section
        contextStr += `\nDETAILED SECTION CONTENT:\n`;
        context.sections.forEach((section, i) => {
            let sectionDisplay = `${i + 1}. ${section.type} (ID: ${section.id}): ${section.content}`;
            
            // Add additional info based on section type
            if (section.type === 'quote' && section.speaker) {
                sectionDisplay += ` [Speaker: ${section.speaker}]`;
            }
            
            if (section.type === 'code' && section.language) {
                sectionDisplay += ` [Language: ${section.language}]`;
            }
            
            if (section.type === 'image') {
                if (section.imageIds && section.imageIds.length > 0) {
                    sectionDisplay += ` [Images: ${section.imageIds.join(', ')}]`;
                } else if (section.mediaId) {
                    sectionDisplay += ` [Image: ${section.mediaId}]`;
                }
            }
            
            if (section.type === 'video' && section.embedUrl) {
                sectionDisplay += ` [URL: ${section.embedUrl}]`;
            }
            
            if (section.type === 'map' && section.data) {
                sectionDisplay += ` [Map Data: ${section.data}]`;
            }
            
            contextStr += sectionDisplay + '\n';
        });
    }
    
    // Truncate if too long - but prioritize showing all section IDs
    if (contextStr.length > maxTokens) {
        console.log(`Article context too long: ${contextStr.length} chars (limit: ${maxTokens}), truncating...`);
        
        // If we're over the limit, try a more aggressive approach
        // First, build a minimal context with just section IDs
        let minimalContext = `Article: "${context.title}"\n`;
        if (context.sections.length > 0) {
            minimalContext += `ALL SECTIONS (${context.sections.length} total):\n`;
            context.sections.forEach((section, i) => {
                minimalContext += `${i + 1}. ${section.type} - ID: ${section.id}\n`;
            });
        }
        
        console.log(`Minimal context length: ${minimalContext.length} chars`);
        
        // If even the minimal context is too long, truncate it
        if (minimalContext.length > maxTokens) {
            contextStr = minimalContext.substring(0, maxTokens - 50) + '...';
            console.log(`Context truncated to ${contextStr.length} chars (was ${minimalContext.length})`);
        } else {
            contextStr = minimalContext;
            console.log(`Using minimal context: ${contextStr.length} chars`);
        }
    } else {
        console.log(`Article context size: ${contextStr.length} chars (within limit: ${maxTokens})`);
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
- title: Article title (string, max 1024 chars) - Main headline
- trailer: Article trailer/teaser (string, max 512 chars) - Short preview text
- subtitle: Article subtitle/description (string, max 2048 chars) - Longer description
- status: Article status (string, max 50 chars) - Values: 'draft', 'unpublished', 'published'
- live: Live status (boolean) - Whether article is publicly visible
- pinned: Pinned status (boolean) - Whether article is pinned/featured
- redirect: Redirect URL (string, max 500 chars) - URL to redirect to instead of article
- slug: Article slug (string, max 255 chars) - URL-friendly version of title
- authors: Author IDs (array of strings, max 512 chars each) - References to authors collection
- categories: Category IDs (array of strings, max 512 chars each) - References to categories collection
- images: Image URLs (array of strings, max 512 chars each) - References to images collection
- createdBy: Creator user ID (string, max 255 chars) - User who created the article
- activeRevisionId: Current active revision ID (string, max 255 chars) - Reference to revisions collection
- blogId: Blog ID (string, max 255 chars) - Reference to blogs collection

Available section types for JSON:
- text: Plain text content (supports markdown formatting)
- title: Section title/heading
- quote: Quoted text with optional speaker attribution
- code: Code block with syntax highlighting
- image: Image gallery with multiple image support
- video: YouTube/Vimeo video embed
- map: Interactive map with coordinates

CRITICAL: You have access to ALL section IDs in the context above. NEVER ask the user for section IDs. Always use the IDs from the context.

For content modification requests:
1. Look at the "ALL SECTIONS" list in the context to see all available section IDs
2. Look at the "DETAILED SECTION CONTENT" to identify which sections match the user's request
3. Use the exact section IDs from the context (they are shown as "ID: xxxxx")
4. ALWAYS make your best determination from the available context - never ask for clarification
5. If you see multiple sections that could match, use the most relevant ones
6. If content is truncated, work with what's available and make reasonable assumptions
7. ALWAYS provide the JSON immediately with the section IDs you can identify

CRITICAL: When updating existing content:
- Use "action": "update" with the existing section ID from the context
- NEVER use "action": "create" with "id": "new" for existing content
- Only use "action": "create" when adding genuinely new content that doesn't exist
- For any content that already exists (quotes, titles, text, etc.), ALWAYS update the existing section

MANDATORY JSON EXAMPLES:
{"article": {"title": "New Article Title"}}
{"article": {"subtitle": "Updated subtitle text"}}
{"article": {"status": "published"}}
{"article": {"authors": ["author1", "author2"]}}

// Section examples:
{"sections": [{"type": "text", "content": "New paragraph content", "id": "section1", "action": "update"}]}
{"sections": [{"type": "title", "content": "New Section Title", "id": "new", "action": "create"}]}
{"sections": [{"type": "code", "content": "console.log('Hello World');", "id": "section3", "action": "update"}]}
{"sections": [{"type": "quote", "content": "This is an inspiring quote", "speaker": "Author Name", "id": "new", "action": "create"}]}
{"sections": [{"type": "image", "imageIds": ["img1", "img2"], "id": "new", "action": "create"}]}
{"sections": [{"type": "video", "embedUrl": "https://youtube.com/watch?v=example", "id": "new", "action": "create"}]}
{"sections": [{"type": "map", "data": "{\"lat\": 40.7128, \"lng\": -74.0060}", "id": "new", "action": "create"}]}

// Content update examples (CRITICAL - use existing IDs):
{"sections": [{"type": "quote", "content": "Updated quote text", "id": "68e7bbe8001f12708e76", "action": "update"}]}
{"sections": [{"type": "text", "content": "Updated paragraph", "id": "68e70f170011c920957d", "action": "update"}]}
{"sections": [{"type": "title", "content": "Updated Title", "id": "68e70f170011c691868c", "action": "update"}]}

// Positioning examples:
{"sections": [{"type": "text", "content": "Insert at beginning", "id": "new", "action": "create", "position": 0}]}
{"sections": [{"type": "text", "content": "Insert at position 2", "id": "new", "action": "create", "position": 2}]}
{"sections": [{"type": "text", "id": "section1", "action": "move", "position": 0}]}
{"sections": [{"type": "text", "id": "section1", "action": "move", "targetId": "section3"}]}
{"sections": [{"type": "text", "id": "section1", "action": "delete"}]}
{"sections": [{"type": "title", "id": "68e70f170011c30c6c1c", "action": "delete"}, {"type": "text", "id": "68e70f170011c920957d", "action": "delete"}]}

// Multiple changes:
{"article": {"title": "New Title"}, "sections": [{"type": "text", "content": "New content", "id": "new", "action": "create"}]}


When the user asks you to change something, respond with the JSON format immediately, followed by a brief explanation. For example:
User: "Change the title to 'My New Title'"
You: '{"article": {"title": "My New Title"}}

Updated the title to 'My New Title'.'

User: "Update the FAQ section"
You: '{"sections": [{"type": "text", "id": "68e70f170011c30c6c1c", "action": "update", "content": "Updated FAQ content here"}]}

Updated the FAQ section with new content.'

ABSOLUTELY FORBIDDEN:
- NEVER ask users for section IDs, section numbers, or any technical details
- NEVER say "I need the exact section IDs" or similar phrases
- NEVER ask for clarification about which sections to modify
- ALWAYS work with the section IDs provided in the context above
- NEVER use "action": "create" with "id": "new" for existing content (quotes, titles, text)
- NEVER duplicate existing content by creating new sections instead of updating

REMEMBER: You MUST use the JSON format for ALL changes. Start with valid JSON, then add your explanation.`;
    }
    
    return basePrompt + `

You can help edit articles by providing specific instructions. When you want to make changes, you MUST use the JSON format described above.

Available article fields for JSON:
- title: Article title (string, max 1024 chars) - Main headline
- trailer: Article trailer/teaser (string, max 512 chars) - Short preview text
- subtitle: Article subtitle/description (string, max 2048 chars) - Longer description
- status: Article status (string, max 50 chars) - Values: 'draft', 'unpublished', 'published'
- live: Live status (boolean) - Whether article is publicly visible
- pinned: Pinned status (boolean) - Whether article is pinned/featured
- redirect: Redirect URL (string, max 500 chars) - URL to redirect to instead of article
- slug: Article slug (string, max 255 chars) - URL-friendly version of title
- authors: Author IDs (array of strings, max 512 chars each) - References to authors collection
- categories: Category IDs (array of strings, max 512 chars each) - References to categories collection
- images: Image URLs (array of strings, max 512 chars each) - References to images collection
- createdBy: Creator user ID (string, max 255 chars) - User who created the article
- activeRevisionId: Current active revision ID (string, max 255 chars) - Reference to revisions collection
- blogId: Blog ID (string, max 255 chars) - Reference to blogs collection

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
    // Get JWT token and dynamic API key from headers
    const jwtToken = req.headers['x-appwrite-user-jwt'];
    const userId = req.headers['x-appwrite-user-id'];
    const dynamicApiKey = req.headers['x-appwrite-key'];
    
    log(`Agent function called - User: ${userId || 'anonymous'}, Method: ${req.method}`);

    // Authenticate using JWT token for user verification
    if (jwtToken) {
      client.setJWT(jwtToken);
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

    // Parse the request body
    const body = req.bodyJson;

    // Validate required fields
    if (!body) {
      return res.json({
        success: false,
        error: 'Request body is required'
      }, 400);
    }

    const { conversationId, agentId, blogId, metadata, articleId } = body;
    log(`Processing request - Conversation: ${conversationId}, Article: ${articleId || 'none'}`);

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

    // Article context will be loaded later after we get the revisionId from conversation messages

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
        // Only log important messages to console, not all debug messages
        if (message.includes('ERROR') || message.includes('Failed') || message.includes('Stream completed')) {
          log(message);
        }
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

        // Limit conversation history to prevent token limit issues (keep last 100 messages)
        const limitedConversationMessages = conversationMessages.slice(-100);
        if (conversationMessages.length > 100) {
          addDebugLog(`Limited conversation to last 100 messages (was ${conversationMessages.length})`);
        }

        // Add system prompt at the beginning for context
        const systemPrompt = buildSystemPrompt(articleContext);
        addDebugLog(`System prompt built: ${systemPrompt.length} chars, article context: ${articleContext ? 'Yes' : 'No'}`);
        
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
        
        if (!apiKey) {
          throw new Error('OPENAI_API_KEY environment variable is not set');
        }

        // Use OpenAI model to generate streaming response
        addDebugLog(`Calling OpenAI model with ${messagesWithSystem.length} messages`);
        
        // Create a new model instance with the verified API key
        const dynamicOpenaiModel = new OpenAICompatibleModel({
          id: 'openai/gpt-5',
          apiKey: apiKey,
        });

        const streamParams = {
          prompt: messagesWithSystem,
          temperature: 0.7,
          max_tokens: 2000
        };
        
        const streamResult = await dynamicOpenaiModel.doStream(streamParams);
        addDebugLog('OpenAI stream started');

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
        
        // Cost tracking variables
        let inputTokens = 0;
        let outputTokens = 0;
        let totalTokens = 0;
        let estimatedCost = 0;
        
        // Function to calculate cost based on token usage
        const calculateCost = (inputTokens, outputTokens) => {
          // GPT-5 pricing (as of 2024, these are estimated rates)
          const INPUT_COST_PER_1K_TOKENS = 0.005; // $0.005 per 1K input tokens
          const OUTPUT_COST_PER_1K_TOKENS = 0.015; // $0.015 per 1K output tokens
          
          const inputCost = (inputTokens / 1000) * INPUT_COST_PER_1K_TOKENS;
          const outputCost = (outputTokens / 1000) * OUTPUT_COST_PER_1K_TOKENS;
          
          return {
            inputCost: inputCost,
            outputCost: outputCost,
            totalCost: inputCost + outputCost,
            inputTokens: inputTokens,
            outputTokens: outputTokens,
            totalTokens: inputTokens + outputTokens
          };
        };

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

        addDebugLog('Starting to process streaming chunks...');

        try {
          // Process streaming chunks
          for await (const chunk of streamResult.stream) {
            if (streamCompleted) {
              addDebugLog('Stream completed due to timeout, breaking loop');
              break;
            }
            
            // Handle different chunk types from Mastra stream
            if (chunk.type === 'text-delta' && chunk.delta) {
              const content = chunk.delta;
              fullContent += content;
              chunkCount++;
              lastChunkTime = Date.now();
              resetInactivityTimeout(); // Reset inactivity timeout when we receive content

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
              addDebugLog('Stream finished normally');
              
              // Extract usage information if available
              if (chunk.usage) {
                inputTokens = chunk.usage.inputTokens || 0;
                outputTokens = chunk.usage.outputTokens || 0;
                totalTokens = chunk.usage.totalTokens || (inputTokens + outputTokens);
                
                const costInfo = calculateCost(inputTokens, outputTokens);
                estimatedCost = costInfo.totalCost;
              }
              
              // Don't break immediately, wait for potential final content
              setTimeout(() => {
                if (!streamCompleted) {
                  streamCompleted = true;
                }
              }, 1000); // Wait 1 second for final content
            } else if (chunk.type === 'text-end') {
              // Don't break immediately, wait for potential final content
              setTimeout(() => {
                if (!streamCompleted) {
                  streamCompleted = true;
                }
              }, 1000); // Wait 1 second for final content
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
        addDebugLog(`Stream completed: ${chunkCount} chunks, ${fullContent.length} chars`);

        // If no content was received, provide a fallback
        if (!fullContent || fullContent.trim().length === 0) {
          addDebugLog('No content received, using fallback message');
          fullContent = "I apologize, but I'm having trouble generating a response right now. Please try again.";
        }

        // Calculate total generation time
        const generationTimeMs = Date.now() - generationStartTime;
        
        // If no usage information was provided, estimate based on content length
        if (totalTokens === 0) {
          // Rough estimation: 1 token ≈ 4 characters for English text
          const estimatedInputTokens = Math.ceil(JSON.stringify(messagesWithSystem).length / 4);
          const estimatedOutputTokens = Math.ceil(fullContent.length / 4);
          
          inputTokens = estimatedInputTokens;
          outputTokens = estimatedOutputTokens;
          totalTokens = inputTokens + outputTokens;
          
          const costInfo = calculateCost(inputTokens, outputTokens);
          estimatedCost = costInfo.totalCost;
        }

        // Add a small delay to ensure all content is processed
        await new Promise(resolve => setTimeout(resolve, 500));

        // Parse LLM response for article updates and create new revision
        let newRevisionId = null;
        
        if (revisionId && articleId && fullContent) {
          try {
            // Extract JSON from the response (look for JSON at the beginning)
            let jsonStr = null;
            let jsonMatch = fullContent.match(/^\{[\s\S]*?\}\n/);
            
            if (!jsonMatch) {
              jsonMatch = fullContent.match(/^\{[\s\S]*?\}(?=\n|$)/);
            }
            
            if (!jsonMatch) {
              jsonMatch = fullContent.match(/^\{[\s\S]*?\}/);
            }
            
            if (jsonMatch) {
              jsonStr = jsonMatch[0].trim();
              
              try {
                const updates = JSON.parse(jsonStr);
                
                // Get current article and revision
              const currentArticle = await serverDatabases.getDocument(databaseId, 'articles', articleId);
              const currentRevision = await serverDatabases.getDocument(databaseId, 'revisions', revisionId);
              
              // Get team ID from the blog for proper permissions
              let teamId = null;
              if (currentArticle.blogId) {
                try {
                  const blog = await serverDatabases.getDocument(databaseId, 'blogs', currentArticle.blogId);
                  teamId = blog.teamId;
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
                      
                      // Include additional fields based on section type
                      if (update.speaker) {
                        newSection.speaker = update.speaker;
                      }
                      
                      if (update.language) {
                        newSection.language = update.language;
                      }
                      
                      if (update.imageIds) {
                        newSection.imageIds = update.imageIds;
                      }
                      
                      if (update.mediaId) {
                        newSection.mediaId = update.mediaId;
                      }
                      
                      if (update.embedUrl) {
                        newSection.embedUrl = update.embedUrl;
                      }
                      
                      if (update.data) {
                        newSection.data = update.data;
                      }
                      
                      if (update.position !== undefined) {
                        sections.splice(update.position, 0, newSection);
                      } else {
                        sections.push(newSection);
                      }
                      break;
                      
                    case 'update':
                      const updateIndex = sections.findIndex(s => s.id === update.id);
                      if (updateIndex !== -1) {
                        sections[updateIndex] = { ...sections[updateIndex], ...update };
                      }
                      break;
                      
                    case 'delete':
                      sections = sections.filter(s => s.id !== update.id);
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
                      }
                      break;
                  }
                });
                
                updatedArticle.body = JSON.stringify(sections);
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
                userName: 'Cortext',
                userEmail: 'noreply@cortext',
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
              
              const newRevision = await serverDatabases.createDocument(
                databaseId,
                'revisions',
                ServerID.unique(),
                newRevisionData,
                permissions
              );
              
              newRevisionId = newRevision.$id;
              
              // Update article's active revision ID
              await serverDatabases.updateDocument(databaseId, 'articles', articleId, {
                activeRevisionId: newRevisionId
              });
              } catch (jsonParseError) {
                addDebugLog(`Error parsing JSON: ${jsonParseError.message}`);
                // Continue without creating revision
              }
            } else {
              addDebugLog('No JSON found in LLM response, skipping revision creation');
            }
          } catch (parseError) {
            addDebugLog(`Error parsing LLM response or creating revision: ${parseError.message}`);
            // Continue without creating revision
          }
        }

        // Final update with complete content, revision ID, and truncated debug logs
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
              cached: true,
              // Cost information
              inputTokens: inputTokens,
              outputTokens: outputTokens,
              totalTokens: totalTokens,
              estimatedCost: estimatedCost,
              costBreakdown: {
                inputCost: (inputTokens / 1000) * 0.005,
                outputCost: (outputTokens / 1000) * 0.015,
                totalCost: estimatedCost
              }
            }, 10, 80)
          }
        );
        
        // Verify the message was updated correctly
        try {
          const updatedMessage = await serverDatabases.getDocument(databaseId, 'messages', initialMessage.$id);
        } catch (verifyError) {
          addDebugLog(`Failed to verify message update: ${verifyError.message}`);
        }
        
        addDebugLog(`Final cost summary - Input: ${inputTokens} tokens ($${((inputTokens / 1000) * 0.005).toFixed(6)}), Output: ${outputTokens} tokens ($${((outputTokens / 1000) * 0.015).toFixed(6)}), Total: $${estimatedCost.toFixed(6)}`);

        log(`Streaming completed. Final content length: ${fullContent.length}, chunks: ${chunkCount}`);
        log(`Cost: $${estimatedCost.toFixed(6)} (${totalTokens} tokens: ${inputTokens} input + ${outputTokens} output)`);

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

    // Load article context from revision data if revisionId is available
    let articleContext = '';
    if (revisionId && articleId) {
      try {
        const revision = await serverDatabases.getDocument(databaseId, 'revisions', revisionId);
        const revisionData = revision.data ? JSON.parse(revision.data) : {};
        const articleData = revisionData.attributes || revisionData;
        articleContext = buildArticleContext(articleData);
        log(`Loaded article context from revision ${revisionId} (${articleContext.length} chars)`);
      } catch (error) {
        log(`Failed to load revision ${revisionId}: ${error.message}`);
        // Fallback: try to load from main article if revision fails
        try {
          const article = await serverDatabases.getDocument(databaseId, 'articles', articleId);
          articleContext = buildArticleContext(article);
          log(`Fallback: loaded from main article ${articleId}`);
        } catch (fallbackError) {
          log(`Failed to load main article ${articleId}: ${fallbackError.message}`);
        }
      }
    } else if (articleId) {
      // If no revisionId but we have articleId, load from main article
      try {
        const article = await serverDatabases.getDocument(databaseId, 'articles', articleId);
        articleContext = buildArticleContext(article);
        log(`Loaded article context from main article ${articleId}`);
      } catch (error) {
        log(`Failed to load main article ${articleId}: ${error.message}`);
      }
    }

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

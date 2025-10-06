# Agent Function

This Appwrite function generates AI agent responses and creates assistant messages in the messages collection for a given conversation ID. It loads the conversation history and generates a dummy LLM response based on the context.

## Function Details

- **Runtime**: Node.js
- **Entry Point**: `index.js`
- **Dependencies**: Appwrite Client SDK, Node Appwrite Server SDK

## Authentication Architecture

The function uses a hybrid authentication approach for enhanced security:

1. **JWT Authentication (User Verification)**: Uses the JWT token from the authenticated user
   - Automatically provided in the `x-appwrite-user-jwt` header when called from client-side
   - Used for user verification and permission validation
   - Ensures the function operates on behalf of the authenticated user

2. **Server SDK with Dynamic API Key (Database Operations)**: Uses the server-side Node SDK
   - Requires `x-appwrite-key` header with dynamic API key
   - Handles all database write operations with fine-grained permissions
   - Provides better security by separating authentication from data operations

## Environment Variables

The function requires the following environment variables:

- `APPWRITE_ENDPOINT`: Your Appwrite endpoint URL
- `APPWRITE_PROJECT_ID`: Your Appwrite project ID
- `APPWRITE_DATABASE_ID`: Your Appwrite database ID

## Required Headers

The function requires the following headers:

- `x-appwrite-user-jwt`: JWT token for user authentication
- `x-appwrite-key`: Dynamic API key for server operations

## Request Format

Send a POST request with the following JSON body:

```json
{
  "conversationId": "string (required)",
  "agentId": "string (optional)",
  "blogId": "string (required)",
  "metadata": "object (optional)"
}
```

**Note**: 
- The function automatically generates a dummy LLM response based on the conversation context
- The `userId` is automatically extracted from the JWT token
- User messages should be created in the UI, this function only creates assistant responses

## Response Format

### Success Response (200)
```json
{
  "success": true,
  "message": {
    "id": "message-id",
    "conversationId": "conversation-id",
    "content": "message content",
    "role": "assistant",
    "userId": "user-id",
    "agentId": "agent-id",
    "blogId": "blog-id",
    "metadata": "metadata-json-string",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "conversationHistory": [
    {
      "id": "msg-1",
      "role": "user",
      "content": "Hello, how can you help me?",
      "userId": "user-id",
      "agentId": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "metadata": null
    },
    {
      "id": "msg-2",
      "role": "assistant",
      "content": "I can help you with various tasks...",
      "userId": "user-id",
      "agentId": "agent-id",
      "createdAt": "2024-01-01T00:01:00.000Z",
      "metadata": {"model": "gpt-4", "temperature": 0.7}
    }
  ],
  "conversationStats": {
    "totalMessages": 2,
    "userMessages": 1,
    "assistantMessages": 1,
    "systemMessages": 0
  }
}
```

### Error Response (400/500)
```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error message"
}
```

## Features

- **AI Agent Response Generation**: Creates dummy LLM responses based on conversation context
- **Hybrid Authentication**: JWT for user verification, Server SDK for database operations
- **Enhanced Security**: Separates user authentication from data operations
- **User Context**: Automatically extracts user information from JWT tokens
- **Read-Only Agent Messages**: Users can read agent messages but cannot modify or delete them
- **Conversation History Loading**: Loads complete conversation history for LLM context
- **Smart Response Generation**: Analyzes last user message to generate contextual responses
- **Conversation Updates**: Updates conversation metadata (lastMessageAt, messageCount)
- **Field Validation**: Validates required fields and data types
- **Error Handling**: Comprehensive error handling and logging
- **LLM Ready**: Returns conversation history formatted for AI agent processing

## Usage Flow

1. **User creates message in UI**: User types and sends a message (handled by your frontend)
2. **Call agent function**: Your frontend calls this function to generate an AI response
3. **Function generates response**: Loads conversation history and creates dummy LLM response
4. **Response displayed**: The generated assistant message is shown in the UI

## Deployment

1. Deploy this function to your Appwrite project
2. Set the required environment variables
3. Configure the function scopes for database access
4. Test the function using the Appwrite Console or your application

## Dummy Response Examples

The function generates contextual responses based on the last user message:

- **"Hello"** → "Hello! I'm here to help you. What would you like to know?"
- **"Help me"** → "I'd be happy to help you! Could you please provide more details..."
- **"Thank you"** → "You're welcome! Is there anything else I can help you with?"
- **Custom message** → "I understand you're asking about [message]... This is a dummy response..."

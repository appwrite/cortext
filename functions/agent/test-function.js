/**
 * Simple test script for the agent function
 * This script tests the function with mock data to ensure it works correctly
 */

import { Client, Databases, ID, Permission, Role, Query } from 'appwrite';
import { Client as ServerClient, Databases as ServerDatabases, ID as ServerID, Permission as ServerPermission, Role as ServerRole, Query as ServerQuery } from 'node-appwrite';

// Mock environment variables
process.env.APPWRITE_ENDPOINT = 'https://cloud.appwrite.io/v1';
process.env.APPWRITE_PROJECT_ID = 'test-project';
process.env.APPWRITE_DATABASE_ID = 'test-database';

// Mock request and response objects
const mockRequest = {
  method: 'POST',
  headers: {
    'x-appwrite-user-jwt': 'mock-jwt-token',
    'x-appwrite-user-id': 'test-user-id',
    'x-appwrite-key': 'mock-dynamic-api-key'
  },
  bodyJson: {
    conversationId: 'test-conversation-id',
    agentId: 'test-agent-id',
    blogId: 'test-blog-id',
    metadata: {
      test: true
    }
  }
};

const mockResponse = {
  json: (data, status = 200) => {
    return { data, status };
  }
};

const mockLog = (message) => {
  // Mock log function
};

const mockError = (message) => {
  // Mock error function
};

// Test the function
async function testFunction() {
  try {
    // Import the function (this would normally be done by Appwrite)
    const agentFunction = (await import('./index.js')).default;
    
    // Call the function with mock data
    const result = await agentFunction({
      req: mockRequest,
      res: mockResponse,
      log: mockLog,
      error: mockError
    });
    
    return result;
    
  } catch (error) {
    // Test failed
    throw error;
  }
}

// Run the test
testFunction();

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
    console.log(`Response Status: ${status}`);
    console.log('Response Data:', JSON.stringify(data, null, 2));
    return { data, status };
  }
};

const mockLog = (message) => {
  console.log(`[LOG] ${message}`);
};

const mockError = (message) => {
  console.error(`[ERROR] ${message}`);
};

// Test the function
async function testFunction() {
  try {
    console.log('Testing Agent Function...');
    console.log('========================');
    
    // Import the function (this would normally be done by Appwrite)
    const agentFunction = (await import('./index.js')).default;
    
    // Call the function with mock data
    const result = await agentFunction({
      req: mockRequest,
      res: mockResponse,
      log: mockLog,
      error: mockError
    });
    
    console.log('\nTest completed successfully!');
    console.log('Function returned:', result);
    
  } catch (error) {
    console.error('Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testFunction();

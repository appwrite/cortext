import { getFunctionsClient } from './index';
import { ExecutionMethod } from 'appwrite';

// Function ID constant - matches the setup in scripts/setup-appwrite.js
const AGENT_FUNCTION_ID = import.meta.env.VITE_APPWRITE_AGENT_FUNCTION_ID;

if (!AGENT_FUNCTION_ID) {
  throw new Error('VITE_APPWRITE_AGENT_FUNCTION_ID environment variable is required');
}

const functions = getFunctionsClient();

export const functionService = {
  // Updated to include articleId parameter
  /**
   * Trigger the agent function to generate a response
   * @param conversationId - The conversation ID
   * @param blogId - The blog ID
   * @param agentId - Optional agent ID (defaults to 'dummy-agent')
   * @param articleId - The article ID for context
   * @param metadata - Optional metadata to pass to the function
   */
  async triggerAgentResponse(params: {
    conversationId: string;
    blogId: string;
    agentId?: string;
    articleId: string;
    metadata?: any;
  }) {
    const { conversationId, blogId, agentId = 'dummy-agent', articleId, metadata = {} } = params;
    try {
      const execution = await functions.createExecution(
        AGENT_FUNCTION_ID,
        JSON.stringify({
          conversationId,
          blogId,
          agentId,
          articleId,
          metadata
        }),
        true, // async: false - wait for completion to trigger realtime events
        '/', // path
        ExecutionMethod.POST, // method
        {
          'Content-Type': 'application/json'
        } // headers as object
      );

      return execution;
    } catch (error) {
      console.error('Failed to trigger agent function:', error);
      throw error;
    }
  },

  /**
   * Get the status of a function execution
   * @param executionId - The execution ID
   */
  async getExecutionStatus(executionId: string) {
    try {
      const execution = await functions.getExecution({
        functionId: AGENT_FUNCTION_ID,
        executionId
      });

      return execution;
    } catch (error) {
      console.error('Failed to get execution status:', error);
      throw error;
    }
  },

  /**
   * List all executions for the agent function
   * @param queries - Optional query parameters
   */
  async listExecutions(queries?: string[]) {
    try {
      const executions = await functions.listExecutions({
        functionId: AGENT_FUNCTION_ID,
        queries
      });

      return executions;
    } catch (error) {
      console.error('Failed to list executions:', error);
      throw error;
    }
  }
};

export { AGENT_FUNCTION_ID };

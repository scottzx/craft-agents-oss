/**
 * Agent Service - Wrapper for Claude Agent SDK
 * Provides simplified interface for HTTP API
 */

import { query, type Options } from '@anthropic-ai/claude-agent-sdk';
import { agentConfig, setupAnthropicEnv } from '../config/agent.js';
import type { Message, ChatResponse, ToolCallRecord } from '../types.js';

export interface ChatOptions {
  sessionId?: string;
  enableTools?: boolean;
  skillId?: string;
}

export class AgentService {
  private initialized = false;

  constructor() {
    // Set up environment variables before any SDK calls
    setupAnthropicEnv();
    this.initialized = true;
  }

  /**
   * Process a chat request using Claude Agent SDK
   */
  async chat(messages: Message[], options: ChatOptions = {}): Promise<ChatResponse> {
    if (!this.initialized) {
      throw new Error('AgentService not initialized');
    }

    const startTime = Date.now();

    try {
      // Build prompt from messages
      const prompt = this.buildPrompt(messages);

      // Configure SDK options
      const sdkOptions: Options = {
        apiKey: agentConfig.apiKey,
        model: agentConfig.customModel || 'claude-sonnet-4-5-20250929',
      };

      // Add base URL if configured
      if (agentConfig.baseUrl) {
        // Note: The SDK reads from ANTHROPIC_BASE_URL env var
        // which we set in setupAnthropicEnv()
      }

      // Execute query (non-streaming for now)
      let fullResponse = '';
      const toolCalls: ToolCallRecord[] = [];

      const agentQuery = query({ prompt, options: sdkOptions });

      for await (const message of agentQuery) {
        // Extract text content from assistant messages
        if ('type' in message && message.type === 'assistant' && 'message' in message) {
          const assistantMsg = message.message as { content?: unknown[] };
          if (assistantMsg.content && Array.isArray(assistantMsg.content)) {
            for (const block of assistantMsg.content) {
              if (typeof block === 'object' && 'text' in block) {
                fullResponse += block.text;
              }
            }
          }
        }

        // Track tool calls
        if ('type' in message && message.type === 'tool_start') {
          const toolCall: ToolCallRecord = {
            name: message.toolName,
            input: message.input as Record<string, unknown>,
          };
          toolCalls.push(toolCall);
        }

        // Track tool results
        if ('type' in message && message.type === 'tool_end') {
          const existingCall = toolCalls.find(tc => tc.name === message.toolName);
          if (existingCall) {
            if (message.error) {
              existingCall.error = message.error;
            } else {
              existingCall.output = message.output;
            }
          }
        }
      }

      // Calculate usage (approximate)
      const inputTokens = this.estimateTokens(prompt);
      const outputTokens = this.estimateTokens(fullResponse);

      return {
        content: fullResponse,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        usage: {
          inputTokens,
          outputTokens,
        },
        sessionId: options.sessionId || this.generateSessionId(),
      };

    } catch (error) {
      console.error('Agent chat error:', error);
      throw error;
    }
  }

  /**
   * Build a prompt from message history
   */
  private buildPrompt(messages: Message[]): string {
    let prompt = '';

    for (const msg of messages) {
      switch (msg.role) {
        case 'system':
          prompt += `<system>${msg.content}</system>\n\n`;
          break;
        case 'user':
          prompt += `<user>${msg.content}</user>\n\n`;
          break;
        case 'assistant':
          prompt += `<assistant>${msg.content}</assistant>\n\n`;
          break;
      }
    }

    return prompt.trim();
  }

  /**
   * Generate a random session ID
   */
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Estimate token count (rough approximation: ~4 chars per token)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Health check for the agent
   */
  async healthCheck(): Promise<boolean> {
    return this.initialized;
  }
}

// Singleton instance
let agentServiceInstance: AgentService | null = null;

export function getAgentService(): AgentService {
  if (!agentServiceInstance) {
    agentServiceInstance = new AgentService();
  }
  return agentServiceInstance;
}

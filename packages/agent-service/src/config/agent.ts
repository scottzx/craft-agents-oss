/**
 * Agent configuration for CraftAgent
 */

import { env } from './env.js';

export interface AgentConfig {
  apiKey: string;
  baseUrl?: string;
  customModel?: string;
  systemPrompt?: string;
  enableTools: boolean;
  workspacePath: string;
}

/**
 * Create agent configuration from environment variables
 */
export function createAgentConfig(): AgentConfig {
  const config: AgentConfig = {
    apiKey: env.anthropicApiKey,
    enableTools: true,
    workspacePath: process.env.WORKSPACE_PATH || '/app/workspace',
  };

  // Set custom base URL if provided
  if (env.anthropicBaseUrl) {
    config.baseUrl = env.anthropicBaseUrl;
  }

  // Set custom model if provided
  if (env.customModel) {
    config.customModel = env.customModel;
  }

  // Optional: custom system prompt
  const systemPrompt = process.env.SYSTEM_PROMPT;
  if (systemPrompt) {
    config.systemPrompt = systemPrompt;
  }

  return config;
}

export const agentConfig = createAgentConfig();

/**
 * Set environment variables for Anthropic SDK
 * This must be called before initializing CraftAgent
 */
export function setupAnthropicEnv(): void {
  process.env.ANTHROPIC_API_KEY = agentConfig.apiKey;

  if (agentConfig.baseUrl) {
    process.env.ANTHROPIC_BASE_URL = agentConfig.baseUrl;
  }

  if (agentConfig.customModel) {
    process.env.ANTHROPIC_MODEL = agentConfig.customModel;
  }
}

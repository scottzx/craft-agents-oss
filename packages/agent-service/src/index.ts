/**
 * Agent API Service - Entry point
 */

export { createServer, startServer } from './server.js';
export { getAgentService, type ChatOptions, type AgentService } from './services/agent-service.js';
export type {
  Message,
  ChatRequest,
  ChatResponse,
  ToolCallRecord,
  HealthResponse,
  AuthContext,
  ErrorResponse,
} from './types.js';
export { loadEnvConfig, env } from './config/env.js';
export { createAgentConfig, agentConfig, setupAnthropicEnv } from './config/agent.js';

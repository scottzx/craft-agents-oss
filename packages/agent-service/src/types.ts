/**
 * Type definitions for Agent API Service
 */

// Message types
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Chat request
export interface ChatRequest {
  messages: Message[];
  sessionId?: string;
  stream?: boolean;
  enableTools?: boolean;
  skillId?: string;
}

// Chat response
export interface ChatResponse {
  content: string;
  toolCalls?: ToolCallRecord[];
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  sessionId: string;
}

// Tool call record
export interface ToolCallRecord {
  name: string;
  input: Record<string, unknown>;
  output?: unknown;
  error?: string;
}

// Health check response
export interface HealthResponse {
  status: 'ok' | 'error';
  version: string;
  uptime: number;
  timestamp: string;
}

// Auth context (from JWT token)
export interface AuthContext {
  openid: string;
  // Add other claims as needed
}

// Error response
export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}

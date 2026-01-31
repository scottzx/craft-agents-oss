/**
 * Environment configuration for Agent Service
 */

interface EnvConfig {
  // Anthropic API Configuration
  anthropicApiKey: string;
  anthropicBaseUrl?: string;
  customModel?: string;

  // JWT Secret for token validation
  jwtSecret: string;

  // CloudBase Configuration
  cloudbaseEnvId: string;

  // Server Configuration
  port: number;
  host: string;
  nodeEnv: string;

  // Rate Limiting
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}

/**
 * Load and validate environment variables
 */
export function loadEnvConfig(): EnvConfig {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY is required');
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is required');
  }

  const cloudbaseEnvId = process.env.CLOUDBASE_ENV_ID || '';
  const anthropicBaseUrl = process.env.ANTHROPIC_BASE_URL?.trim();
  const customModel = process.env.CUSTOM_MODEL?.trim();

  return {
    anthropicApiKey,
    anthropicBaseUrl,
    customModel,
    jwtSecret,
    cloudbaseEnvId,
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  };
}

export const env = loadEnvConfig();

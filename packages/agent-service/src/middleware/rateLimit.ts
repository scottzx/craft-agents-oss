/**
 * Rate limiting configuration for Fastify
 */

import { env } from '../config/env.js';

/**
 * Rate limit options
 * Uses in-memory storage by default
 */
export const rateLimitOptions = {
  global: true,
  max: env.rateLimitMaxRequests, // Max requests per window
  timeWindow: env.rateLimitWindowMs, // Time window in milliseconds
  cache: 10000, // Max 10k entries in cache
  allowList: ['127.0.0.1'], // Always allow localhost
  redis: undefined, // Can be configured to use Redis for distributed rate limiting
  skipOnError: false, // Continue rate limiting even if Redis fails
  isRateLimitedKeyGenerator: (request: any) => {
    // Rate limit by user ID if authenticated, otherwise by IP
    return request.auth?.openid || request.ip;
  },
  errorResponseBuilder: (request: any, context: any) => {
    return {
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${Math.round(context.after / 1000)} seconds.`,
      statusCode: 429,
      timestamp: new Date().toISOString(),
      retryAfter: context.after,
    };
  },
};

/**
 * Different rate limits for different endpoints
 */
export const rateLimitConfigs = {
  // Chat endpoint: stricter limits
  chat: {
    max: 20, // 20 requests per minute
    timeWindow: 60 * 1000, // 1 minute
  },

  // Health check: very lenient
  health: {
    max: 100,
    timeWindow: 60 * 1000,
  },

  // Default: use global config
  default: rateLimitOptions,
};

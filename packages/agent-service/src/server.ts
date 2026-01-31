/**
 * Agent API Server - Main entry point
 * HTTP API for Claude Agent SDK
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';
import { authMiddleware, optionalAuthMiddleware } from './middleware/auth.js';
import { errorHandler, notFoundHandler, timeoutHandler } from './middleware/errorHandler.js';
import { rateLimitOptions, rateLimitConfigs } from './middleware/rateLimit.js';
import { chatRoutes } from './routes/chat.js';
import { healthRoutes } from './routes/health.js';

/**
 * Create and configure Fastify server
 */
export async function createServer() {
  const fastify = Fastify({
    logger: {
      level: env.nodeEnv === 'production' ? 'info' : 'debug',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
    requestIdHeader: 'x-request-id',
    disableRequestLogging: false,
  });

  // Register CORS
  await fastify.register(cors, {
    origin: env.nodeEnv === 'production'
      ? // In production, allow specific origins (configure via env var)
        (process.env.CORS_ORIGINS?.split(',') || ['https://your-app.com'])
      : // In development, allow all origins
        true,
    credentials: true,
  });

  // Register rate limiting
  await fastify.register(rateLimit, rateLimitOptions);

  // Global error handler
  fastify.setErrorHandler(errorHandler);

  // 404 handler
  fastify.setNotFoundHandler(notFoundHandler);

  // Request timeout
  fastify.addHook('onRequest', timeoutHandler);

  // Health check routes (no auth required)
  await fastify.register(healthRoutes, { prefix: '/api/v1' });

  // Chat routes (auth required)
  await fastify.register(async function (fastify) {
    // Apply auth middleware to all chat routes
    fastify.addHook('preHandler', authMiddleware);

    // Register chat routes
    await fastify.register(chatRoutes);
  }, { prefix: '/api/v1' });

  // Graceful shutdown
  fastify.addHook('onClose', async (instance) => {
    instance.log.info('Server closing, cleaning up...');
  });

  return fastify;
}

/**
 * Start the server
 */
export async function startServer() {
  const server = await createServer();

  try {
    const address = await server.listen({
      port: env.port,
      host: env.host,
    });

    console.log(`\n╔════════════════════════════════════════════════════════════╗`);
    console.log(`║  🤖 Agent API Server                                    ║`);
    console.log(`╠════════════════════════════════════════════════════════════╣`);
    console.log(`║  Status: Running                                         ║`);
    console.log(`║  URL: ${address.padEnd(50)}║`);
    console.log(`║  Environment: ${env.nodeEnv.padEnd(42)}║`);
    console.log(`║  Base URL: ${env.anthropicBaseUrl || 'https://api.anthropic.com'}`);
    console.log(`║                                                            ║`);
    console.log(`║  Endpoints:                                                ║`);
    console.log(`║    GET  /api/v1/health                                     ║`);
    console.log(`║    POST /api/v1/chat                                       ║`);
    console.log(`╚════════════════════════════════════════════════════════════╝\n`);

  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }

  return server;
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

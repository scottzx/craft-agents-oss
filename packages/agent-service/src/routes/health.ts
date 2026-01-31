/**
 * Health check routes
 */

import type { FastifyInstance } from 'fastify';
import type { HealthResponse } from '../types.js';

const START_TIME = Date.now();
const PACKAGE_VERSION = '0.1.0';

/**
 * Register health check routes
 */
export async function healthRoutes(fastify: FastifyInstance) {
  // Basic health check
  fastify.get('/health', async (request, reply) => {
    const response: HealthResponse = {
      status: 'ok',
      version: PACKAGE_VERSION,
      uptime: Date.now() - START_TIME,
      timestamp: new Date().toISOString(),
    };
    await reply.send(response);
  });

  // Detailed health check (with status info)
  fastify.get('/health/detailed', async (request, reply) => {
    const memUsage = process.memoryUsage();
    const response = {
      status: 'ok',
      version: PACKAGE_VERSION,
      uptime: Date.now() - START_TIME,
      timestamp: new Date().toISOString(),
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
      },
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
      },
      env: process.env.NODE_ENV || 'development',
    };
    await reply.send(response);
  });

  // Readiness probe
  fastify.get('/ready', async (request, reply) => {
    // Check if critical services are ready
    const isReady = true; // Could check DB connection, etc.

    if (isReady) {
      await reply.code(200).send({ status: 'ready' });
    } else {
      await reply.code(503).send({ status: 'not ready' });
    }
  });

  // Liveness probe
  fastify.get('/live', async (request, reply) => {
    await reply.code(200).send({ status: 'alive' });
  });
}

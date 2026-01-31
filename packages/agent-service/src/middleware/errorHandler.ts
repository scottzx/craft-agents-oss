/**
 * Global error handler for Fastify
 */

import type { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import type { ErrorResponse } from '../types.js';

/**
 * Format error response
 */
export function formatErrorResponse(error: Error | FastifyError, statusCode: number = 500): ErrorResponse {
  return {
    error: error.name || 'Error',
    message: error.message || 'An unexpected error occurred',
    statusCode,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  request.log.error(error);

  // Handle validation errors
  if (error.validation) {
    reply.status(400).send({
      error: 'Validation Error',
      message: error.message,
      statusCode: 400,
      timestamp: new Date().toISOString(),
      details: error.validation,
    });
    return;
  }

  // Handle HTTP errors with status code
  const statusCode = error.statusCode || 500;

  // Don't expose internal errors in production
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Internal Server Error'
    : error.message || 'An unexpected error occurred';

  reply.status(statusCode).send({
    error: error.name || 'Error',
    message,
    statusCode,
    timestamp: new Date().toISOString(),
  });
}

/**
 * 404 handler
 */
export function notFoundHandler(request: FastifyRequest, reply: FastifyReply) {
  reply.status(404).send({
    error: 'Not Found',
    message: `Route ${request.method} ${request.url} not found`,
    statusCode: 404,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Set timeout for requests
 */
export function timeoutHandler(request: FastifyRequest, reply: FastifyReply, done: () => void) {
  const timeout = setTimeout(() => {
    reply.status(408).send({
      error: 'Request Timeout',
      message: 'Request processing timed out',
      statusCode: 408,
      timestamp: new Date().toISOString(),
    });
  }, 30000); // 30 second timeout

  request.raw.on('close', () => clearTimeout(timeout));
  done();
}

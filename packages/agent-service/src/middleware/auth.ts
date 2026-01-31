/**
 * Authentication middleware for CloudBase token validation
 */

import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { AuthContext } from '../types.js';

// Extend Fastify request type
declare module 'fastify' {
  interface FastifyRequest {
    auth?: AuthContext;
  }
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): AuthContext {
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as AuthContext;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Authentication middleware for Fastify
 * Validates Bearer token from Authorization header
 */
export async function authMiddleware(request: any, reply: any) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Missing Authorization header',
        statusCode: 401,
        timestamp: new Date().toISOString(),
      });
    }

    // Check Bearer scheme
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid Authorization header format. Use: Bearer <token>',
        statusCode: 401,
        timestamp: new Date().toISOString(),
      });
    }

    const token = parts[1];

    // Verify token and attach auth context to request
    const auth = verifyToken(token);
    request.auth = auth;

  } catch (error) {
    reply.status(401).send({
      error: 'Unauthorized',
      message: error instanceof Error ? error.message : 'Authentication failed',
      statusCode: 401,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches auth context if token is present, but doesn't require it
 */
export async function optionalAuthMiddleware(request: any, reply: any) {
  try {
    const authHeader = request.headers.authorization;
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1];
        const auth = verifyToken(token);
        request.auth = auth;
      }
    }
  } catch {
    // Ignore errors for optional auth
  }
}

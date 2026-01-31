/**
 * Chat routes for AI Agent API
 */

import type { FastifyInstance } from 'fastify';
import type { ChatRequest, ChatResponse, ErrorResponse } from '../types.js';
import { getAgentService } from '../services/agent-service.js';

/**
 * Register chat routes
 */
export async function chatRoutes(fastify: FastifyInstance) {
  // POST /api/v1/chat - Send chat messages
  fastify.post('/chat', {
    preHandler: async (request, reply) => {
      // Auth middleware is applied at server level
    },
    schema: {
      body: {
        type: 'object',
        required: ['messages'],
        properties: {
          messages: {
            type: 'array',
            items: {
              type: 'object',
              required: ['role', 'content'],
              properties: {
                role: { type: 'string', enum: ['user', 'assistant', 'system'] },
                content: { type: 'string' },
              },
            },
          },
          sessionId: { type: 'string' },
          stream: { type: 'boolean', default: false },
          enableTools: { type: 'boolean', default: true },
          skillId: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const body = request.body as ChatRequest;

      // Validate request
      if (!body.messages || body.messages.length === 0) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'messages array is required and must not be empty',
          statusCode: 400,
          timestamp: new Date().toISOString(),
        } as ErrorResponse);
      }

      // Validate message format
      for (const msg of body.messages) {
        if (!msg.role || !msg.content) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'Each message must have role and content',
            statusCode: 400,
            timestamp: new Date().toISOString(),
          } as ErrorResponse);
        }
      }

      // Get agent service
      const agentService = getAgentService();

      // Process chat request
      const response = await agentService.chat(body.messages, {
        sessionId: body.sessionId,
        enableTools: body.enableTools !== false,
        skillId: body.skillId,
      });

      // Return response
      return reply.status(200).send(response);

    } catch (error) {
      request.log.error(error);

      // Check for specific error types
      const message = error instanceof Error ? error.message : 'Unknown error';

      return reply.status(500).send({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production'
          ? 'Failed to process chat request'
          : message,
        statusCode: 500,
        timestamp: new Date().toISOString(),
      } as ErrorResponse);
    }
  });

  // POST /api/v1/chat/stream - Streaming chat (SSE)
  // TODO: Implement streaming support
  fastify.post('/chat/stream', {
    preHandler: async (request, reply) => {
      // Auth middleware
    },
  }, async (request, reply) => {
    reply.status(501).send({
      error: 'Not Implemented',
      message: 'Streaming chat is not yet implemented',
      statusCode: 501,
      timestamp: new Date().toISOString(),
    } as ErrorResponse);
  });
}

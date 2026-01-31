# Multi-stage Dockerfile for Agent API Service
FROM oven/bun:1-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb* ./
COPY packages packages/
RUN bun install --frozen-lockfile

# Build the agent-service package
RUN cd packages/agent-service && bun run build

# Production stage
FROM oven/bun:1-alpine
WORKDIR /app

# Copy runtime files
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages/shared ./packages/shared
COPY --from=base /app/packages/core ./packages/core
COPY --from=base /app/packages/agent-service/dist ./packages/agent-service/dist
COPY --from=base /app/packages/agent-service/node_modules ./packages/agent-service/node_modules
COPY --from=base /app/packages/agent-service/package.json ./packages/agent-service/package.json

# Create workspace directory
RUN mkdir -p /app/workspace

# Set environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD bun --eval "fetch('http://localhost:3000/api/v1/health').then(r => { if (!r.ok) throw new Error('health check failed') })"

# Run the server
CMD ["bun", "run", "packages/agent-service/dist/index.js"]

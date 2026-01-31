#!/bin/bash
cd "$(dirname "$0")"
export PORT=3002
export ANTHROPIC_API_KEY="sk-ant-test-key-12345"
export JWT_SECRET="test-secret-for-development"
export NODE_ENV=development
bun src/index.ts

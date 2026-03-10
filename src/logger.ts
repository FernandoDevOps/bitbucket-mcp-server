/**
 * Structured logger using pino.
 *
 * Outputs JSON in production, pretty-prints in development.
 * All modules should import `logger` from here instead of using console.
 */

import pino from 'pino';
import { config } from './config.js';

export const logger = pino({
  name: 'bitbucket-mcp-server',
  level: config.logLevel,
  ...(config.nodeEnv === 'development'
    ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
    : {}),
});

/** Create a child logger scoped to a specific module / handler. */
export function createChildLogger(module: string) {
  return logger.child({ module });
}

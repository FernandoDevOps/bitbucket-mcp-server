/**
 * Application configuration — validated at startup with Zod.
 *
 * All required environment variables are checked once; the rest of the
 * application imports the typed `config` object instead of touching
 * `process.env` directly.
 */

import { z } from 'zod';

const ConfigSchema = z
  .object({
    /** Bitbucket API token (Bearer auth) — preferred over App Passwords. */
    bitbucketApiToken: z.string().min(1).optional(),

    /** Bitbucket account email / username used for Basic auth. */
    bitbucketUsername: z.string().min(1).optional(),

    /** Bitbucket App Password (Basic auth — legacy, use API token instead). */
    bitbucketAppPassword: z.string().min(1).optional(),

    /** Workspace slug that all API calls are scoped to. */
    bitbucketWorkspace: z
      .string({ error: 'BITBUCKET_WORKSPACE is required' })
      .min(1, 'BITBUCKET_WORKSPACE must not be empty'),

    /** Base URL for the Bitbucket REST API (override for testing). */
    bitbucketApiUrl: z.string().url().default('https://api.bitbucket.org/2.0'),

  /** Transport mode: stdio for local dev, http for VPC service deployment. */
  transport: z.enum(['stdio', 'http']).default('stdio'),

  /** Port for the HTTP server (only used when transport = http). */
  port: z.coerce.number().int().min(1).max(65535).default(3000),

  /** Host to bind the HTTP server to (only used when transport = http). */
  host: z.string().default('0.0.0.0'),

  /** Log level (pino levels). */
  logLevel: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

    /** Node environment hint. */
    nodeEnv: z.enum(['development', 'production', 'test']).default('production'),
  })
  .refine(
    (c) => c.bitbucketApiToken || (c.bitbucketUsername && c.bitbucketAppPassword),
    {
      message:
        'Authentication required: set BITBUCKET_API_TOKEN, or both BITBUCKET_USERNAME and BITBUCKET_APP_PASSWORD',
      path: ['bitbucketApiToken'],
    },
  );

export type Config = z.infer<typeof ConfigSchema>;

function loadConfig(): Config {
  const result = ConfigSchema.safeParse({
    bitbucketApiToken: process.env.BITBUCKET_API_TOKEN || undefined,
    bitbucketUsername: process.env.BITBUCKET_USERNAME || undefined,
    bitbucketAppPassword: process.env.BITBUCKET_APP_PASSWORD || undefined,
    bitbucketWorkspace: process.env.BITBUCKET_WORKSPACE,
    bitbucketApiUrl: process.env.BITBUCKET_API_URL || undefined,
    transport: process.env.MCP_TRANSPORT || undefined,
    port: process.env.MCP_PORT || undefined,
    host: process.env.MCP_HOST || undefined,
    logLevel: process.env.LOG_LEVEL || undefined,
    nodeEnv: process.env.NODE_ENV || undefined,
  });

  if (!result.success) {
    const messages = result.error.issues
      .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid configuration:\n${messages}`);
  }

  return result.data;
}

/** Singleton validated config – imported throughout the app. */
export const config: Config = loadConfig();

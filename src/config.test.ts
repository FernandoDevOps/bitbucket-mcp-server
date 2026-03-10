/**
 * Unit tests for the config module.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('config', () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    // Reset modules so config is re-evaluated
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('loads valid configuration with App Password auth', async () => {
    process.env.BITBUCKET_USERNAME = 'test-user';
    process.env.BITBUCKET_APP_PASSWORD = 'test-pass';
    process.env.BITBUCKET_WORKSPACE = 'test-workspace';
    process.env.LOG_LEVEL = 'debug';

    const { config } = await import('./config.js');

    expect(config.bitbucketUsername).toBe('test-user');
    expect(config.bitbucketAppPassword).toBe('test-pass');
    expect(config.bitbucketWorkspace).toBe('test-workspace');
    expect(config.bitbucketApiToken).toBeUndefined();
    expect(config.logLevel).toBe('debug');
    expect(config.bitbucketApiUrl).toBe('https://api.bitbucket.org/2.0');
  });

  it('loads valid configuration with API token auth', async () => {
    process.env.BITBUCKET_API_TOKEN = 'my-api-token';
    process.env.BITBUCKET_WORKSPACE = 'test-workspace';
    delete process.env.BITBUCKET_USERNAME;
    delete process.env.BITBUCKET_APP_PASSWORD;

    const { config } = await import('./config.js');

    expect(config.bitbucketApiToken).toBe('my-api-token');
    expect(config.bitbucketUsername).toBeUndefined();
    expect(config.bitbucketAppPassword).toBeUndefined();
    expect(config.bitbucketWorkspace).toBe('test-workspace');
  });

  it('prefers API token when both are provided', async () => {
    process.env.BITBUCKET_API_TOKEN = 'my-api-token';
    process.env.BITBUCKET_USERNAME = 'test-user';
    process.env.BITBUCKET_APP_PASSWORD = 'test-pass';
    process.env.BITBUCKET_WORKSPACE = 'test-workspace';

    const { config } = await import('./config.js');

    expect(config.bitbucketApiToken).toBe('my-api-token');
    expect(config.bitbucketUsername).toBe('test-user');
  });

  it('throws when no authentication method is provided', async () => {
    delete process.env.BITBUCKET_USERNAME;
    delete process.env.BITBUCKET_APP_PASSWORD;
    delete process.env.BITBUCKET_API_TOKEN;
    process.env.BITBUCKET_WORKSPACE = 'test-workspace';

    await expect(import('./config.js')).rejects.toThrow('Invalid configuration');
  });

  it('applies default values', async () => {
    process.env.BITBUCKET_USERNAME = 'u';
    process.env.BITBUCKET_APP_PASSWORD = 'p';
    process.env.BITBUCKET_WORKSPACE = 'w';
    delete process.env.LOG_LEVEL;
    delete process.env.NODE_ENV;

    const { config } = await import('./config.js');

    expect(config.logLevel).toBe('info');
    expect(config.nodeEnv).toBe('production');
  });
});

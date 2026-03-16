/**
 * Unit tests for custom error classes.
 */

import { describe, it, expect } from 'vitest';
import { ValidationError, BitbucketApiError, ConfigError, NotFoundError } from './errors.js';

describe('errors', () => {
  it('ValidationError has correct properties', () => {
    const err = new ValidationError('bad input');
    expect(err.name).toBe('ValidationError');
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('bad input');
    expect(err).toBeInstanceOf(Error);
  });

  it('BitbucketApiError includes HTTP status and response body', () => {
    const body = { error: { message: 'forbidden' } };
    const err = new BitbucketApiError('API call failed', 403, body);
    expect(err.httpStatus).toBe(403);
    expect(err.responseBody).toEqual(body);
    expect(err.code).toBe('BITBUCKET_API_ERROR');
  });

  it('ConfigError has no statusCode', () => {
    const err = new ConfigError('missing var');
    expect(err.statusCode).toBeUndefined();
    expect(err.code).toBe('CONFIG_ERROR');
  });

  it('NotFoundError builds a readable message', () => {
    const err = new NotFoundError('Repository', 'my-repo');
    expect(err.message).toBe("Repository 'my-repo' not found");
    expect(err.statusCode).toBe(404);
  });
});

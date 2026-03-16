/**
 * Custom error classes for the Bitbucket MCP server.
 *
 * Having distinct error types lets the top-level handler translate each one
 * into the right MCP error code and give the user a clear message.
 */

/** Base class for all application-level errors. */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/** Thrown when Zod validation of tool input fails. */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

/** Thrown when the Bitbucket REST API returns an error. */
export class BitbucketApiError extends AppError {
  constructor(
    message: string,
    public readonly httpStatus: number,
    public readonly responseBody?: unknown,
  ) {
    super(message, 'BITBUCKET_API_ERROR', httpStatus);
    this.name = 'BitbucketApiError';
  }
}

/** Thrown when configuration / environment is invalid. */
export class ConfigError extends AppError {
  constructor(message: string) {
    super(message, 'CONFIG_ERROR');
    this.name = 'ConfigError';
  }
}

/** Thrown when a requested resource (repo, branch, PR…) does not exist. */
export class NotFoundError extends AppError {
  constructor(resource: string, identifier: string) {
    super(`${resource} '${identifier}' not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

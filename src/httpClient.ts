/**
 * Pre-configured Axios instance with:
 *  - Bitbucket API base URL & auth from config
 *  - Automatic retries with exponential back-off (axios-retry)
 *  - Rate-limit header logging
 *  - Structured logging of requests / responses
 */

import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { config } from './config.js';
import { createChildLogger } from './logger.js';
import { BitbucketApiError } from './errors.js';

const log = createChildLogger('http');

/** Create and return the singleton Axios instance. */
function buildClient(): AxiosInstance {
  const useBearer = !!config.bitbucketApiToken;

  const client = axios.create({
    baseURL: config.bitbucketApiUrl,
    // Bearer token takes priority; fall back to Basic auth (App Password).
    ...(useBearer
      ? { headers: { Authorization: `Bearer ${config.bitbucketApiToken}` } }
      : {
          auth: {
            username: config.bitbucketUsername!,
            password: config.bitbucketAppPassword!,
          },
        }),
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    timeout: 30_000, // 30s per request
  });

  log.info({ authMethod: useBearer ? 'api-token' : 'app-password' }, 'HTTP client initialised');

  // ── Retry policy ──────────────────────────────────────────────────────
  axiosRetry(client, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay, // 1 s → 2 s → 4 s
    retryCondition: (error: AxiosError) => {
      // Retry on network errors + 429 (rate-limit) + 5xx
      if (axiosRetry.isNetworkOrIdempotentRequestError(error)) return true;
      const status = error.response?.status;
      return status === 429 || (status !== undefined && status >= 500);
    },
    onRetry: (retryCount, error) => {
      log.warn(
        { retryCount, url: error.config?.url, status: error.response?.status },
        'Retrying Bitbucket API request',
      );
    },
  });

  // ── Request logging ───────────────────────────────────────────────────
  client.interceptors.request.use((req: InternalAxiosRequestConfig) => {
    log.debug({ method: req.method?.toUpperCase(), url: req.url }, 'API request');
    return req;
  });

  // ── Response logging + rate-limit awareness ───────────────────────────
  client.interceptors.response.use(
    (res: AxiosResponse) => {
      const remaining = res.headers['x-ratelimit-remaining'];
      const limit = res.headers['x-ratelimit-limit'];
      if (remaining !== undefined && Number(remaining) < 100) {
        log.warn({ remaining, limit }, 'Bitbucket API rate limit running low');
      }
      log.debug({ status: res.status, url: res.config.url }, 'API response');
      return res;
    },
    (error: AxiosError) => {
      // Re-throw as our own typed error for the handler layer to catch
      if (error.response) {
        throw new BitbucketApiError(
          `Bitbucket API error: ${error.message}`,
          error.response.status,
          error.response.data,
        );
      }
      throw error; // network-level error — let axios-retry handle
    },
  );

  return client;
}

/** Singleton HTTP client used by all handlers. */
export const bitbucketClient: AxiosInstance = buildClient();

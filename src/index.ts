#!/usr/bin/env node

/**
 * Bitbucket MCP Server — production entry-point.
 *
 * Uses the high-level McpServer API (SDK ≥ 1.x) with native Zod schema
 * validation, structured logging (pino), automatic retries, and typed handlers.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';

import { config } from './config.js';
import { logger } from './logger.js';
import { bitbucketClient } from './httpClient.js';

// Zod input schemas
import {
  ListRepositoriesSchema,
  ListProjectsSchema,
  ListBranchesSchema,
  ListTagsSchema,
  GetBranchCommitsSchema,
  CloneRepositorySchema,
  CreateBranchSchema,
  CreatePullRequestSchema,
  ListPullRequestsSchema,
  GetPullRequestSchema,
  ApprovePullRequestSchema,
  DeclinePullRequestSchema,
  MergePullRequestSchema,
  GetPullRequestCommentsSchema,
  AddPullRequestCommentSchema,
  ListDeploymentsSchema,
  GetDeploymentSchema,
} from './schemas.js';

// Typed handler classes
import { RepositoryHandlers } from './handlers/repository.js';
import { BranchHandlers } from './handlers/branch.js';
import { PullRequestHandlers } from './handlers/pullRequest.js';
import { DeploymentHandlers } from './handlers/deployment.js';

// ── Bootstrap ────────────────────────────────────────────────────────────────

const repoHandlers = new RepositoryHandlers(bitbucketClient, config.bitbucketWorkspace);
const branchHandlers = new BranchHandlers(bitbucketClient, config.bitbucketWorkspace);
const prHandlers = new PullRequestHandlers(
  bitbucketClient,
  config.bitbucketWorkspace,
  config.bitbucketUsername,
);
const deployHandlers = new DeploymentHandlers(bitbucketClient, config.bitbucketWorkspace);

/** Create a fresh McpServer instance with all tools registered. */
function createServer(): McpServer {
  const server = new McpServer(
    { name: 'bitbucket-mcp-server', version: '1.0.0' },
    { capabilities: { tools: {} } },
  );
  registerTools(server);
  return server;
}

// ── Tool registrations ───────────────────────────────────────────────────────
// McpServer.tool() accepts a Zod schema and auto-generates JSON-Schema for the
// MCP host, then passes the *parsed & validated* args to the callback.

function registerTools(server: McpServer): void {

server.tool(
  'list_repositories',
  'List repositories in the workspace',
  ListRepositoriesSchema.shape,
  async (args) => {
    return repoHandlers.listRepositories(args);
  },
);

server.tool(
  'list_projects',
  'List all projects in the workspace',
  ListProjectsSchema.shape,
  async (args) => {
    return repoHandlers.listProjects(args);
  },
);

server.tool(
  'list_branches',
  'List branches in a repository',
  ListBranchesSchema.shape,
  async (args) => {
    return repoHandlers.listBranches(args);
  },
);

server.tool('list_tags', 'List tags in a repository', ListTagsSchema.shape, async (args) => {
  return repoHandlers.listTags(args);
});

server.tool(
  'get_branch_commits',
  'Get commit history and details for a specific branch',
  GetBranchCommitsSchema.shape,
  async (args) => {
    return repoHandlers.getBranchCommits(args);
  },
);

server.tool(
  'clone_repository',
  'Clone a repository using SSH (default) or HTTPS',
  CloneRepositorySchema.shape,
  async (args) => {
    return repoHandlers.cloneRepository(args);
  },
);

server.tool(
  'create_branch',
  'Create a new branch in a repository',
  CreateBranchSchema.shape,
  async (args) => {
    return branchHandlers.createBranch(args);
  },
);

server.tool(
  'create_pull_request',
  'Create a new pull request',
  CreatePullRequestSchema.shape,
  async (args) => {
    return prHandlers.createPullRequest(args);
  },
);

server.tool(
  'list_pull_requests',
  'List pull requests in a repository',
  ListPullRequestsSchema.shape,
  async (args) => {
    return prHandlers.listPullRequests(args);
  },
);

server.tool(
  'get_pull_request',
  'Get details of a specific pull request',
  GetPullRequestSchema.shape,
  async (args) => {
    return prHandlers.getPullRequest(args);
  },
);

server.tool(
  'approve_pull_request',
  'Approve a pull request',
  ApprovePullRequestSchema.shape,
  async (args) => {
    return prHandlers.approvePullRequest(args);
  },
);

server.tool(
  'decline_pull_request',
  'Decline a pull request',
  DeclinePullRequestSchema.shape,
  async (args) => {
    return prHandlers.declinePullRequest(args);
  },
);

server.tool(
  'merge_pull_request',
  'Merge a pull request',
  MergePullRequestSchema.shape,
  async (args) => {
    return prHandlers.mergePullRequest(args);
  },
);

server.tool(
  'get_pull_request_comments',
  'Get all comments from a pull request',
  GetPullRequestCommentsSchema.shape,
  async (args) => {
    return prHandlers.getPullRequestComments(args);
  },
);

server.tool(
  'add_pull_request_comment',
  'Add a comment to a pull request',
  AddPullRequestCommentSchema.shape,
  async (args) => {
    return prHandlers.addPullRequestComment(args);
  },
);

server.tool(
  'list_deployments',
  'List deployments for a repository',
  ListDeploymentsSchema.shape,
  async (args) => {
    return deployHandlers.listDeployments(args);
  },
);

server.tool(
  'get_deployment',
  'Get details of a specific deployment',
  GetDeploymentSchema.shape,
  async (args) => {
    return deployHandlers.getDeployment(args);
  },
);

} // end registerTools

// ── Graceful shutdown ────────────────────────────────────────────────────────

let httpServer: Server | undefined;
let stdioServer: McpServer | undefined;
const sessionServers = new Map<string, McpServer>();

async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutting down');
  if (httpServer) httpServer.close();
  for (const [, s] of sessionServers) {
    await s.close();
  }
  if (stdioServer) await stdioServer.close();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// ── Transport: stdio ─────────────────────────────────────────────────────────

async function startStdio() {
  stdioServer = createServer();
  const transport = new StdioServerTransport();
  await stdioServer.connect(transport);
  logger.info('Bitbucket MCP server running on stdio');
}

// ── Transport: Streamable HTTP ───────────────────────────────────────────────

async function startHttp() {
  const app = createMcpExpressApp({ host: config.host });

  // Health-check endpoint for ALB / ECS health probes.
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', version: '1.0.0', transport: 'http' });
  });

  // Per-session transports keyed by session ID.
  const transports = new Map<string, StreamableHTTPServerTransport>();

  // MCP Streamable HTTP endpoint — handles POST, GET (SSE), DELETE.
  app.all('/mcp', async (req, res) => {
    // POST  → client sends JSON-RPC requests / notifications
    // GET   → client opens SSE stream for server-initiated messages
    // DELETE → client terminates the session
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (req.method === 'POST' || req.method === 'GET') {
      // Reuse existing session transport or create a new one.
      let transport: StreamableHTTPServerTransport;

      if (sessionId && transports.has(sessionId)) {
        transport = transports.get(sessionId)!;
      } else if (!sessionId && req.method === 'POST' && isInitializeRequest(req.body)) {
        // New session — each gets its own McpServer (SDK Protocol only supports one transport).
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (id) => {
            transports.set(id, transport);
            logger.info({ sessionId: id }, 'New session created');
          },
        });

        transport.onclose = () => {
          const id = transport.sessionId;
          if (id) {
            transports.delete(id);
            const s = sessionServers.get(id);
            if (s) {
              s.close().catch(() => {});
              sessionServers.delete(id);
            }
          }
          logger.info({ sessionId: id }, 'Session closed');
        };

        const sessionServer = createServer();
        await sessionServer.connect(transport);

        // Store after connect so shutdown can reach it; session ID stored via onsessioninitialized.
        if (transport.sessionId) {
          sessionServers.set(transport.sessionId, sessionServer);
        }
      } else {
        res.status(400).json({ error: 'Bad Request: missing or invalid session' });
        return;
      }

      await transport.handleRequest(req, res, req.body);
    } else if (req.method === 'DELETE') {
      if (sessionId && transports.has(sessionId)) {
        const transport = transports.get(sessionId)!;
        await transport.handleRequest(req, res);
      } else {
        res.status(404).json({ error: 'Session not found' });
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  });

  httpServer = app.listen(config.port, config.host, () => {
    logger.info(
      { host: config.host, port: config.port },
      `Bitbucket MCP server running on http://${config.host}:${config.port}/mcp`,
    );
    logger.info(`Health check: http://${config.host}:${config.port}/health`);
  });
}

// ── Start ────────────────────────────────────────────────────────────────────

async function main() {
  if (config.transport === 'http') {
    await startHttp();
  } else {
    await startStdio();
  }
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});

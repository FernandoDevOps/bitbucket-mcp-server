# Bitbucket MCP Server

> **A community [Model Context Protocol](https://modelcontextprotocol.io/) server for Bitbucket Cloud.**
> Gives AI agents (Copilot, Claude, etc.) safe, typed access to repositories, branches, pull requests, and deployments.

## Quick start

```bash
# 1 — Install
npm ci

# 2 — Configure (copy and fill in your credentials)
cp .env.example .env

# 3 — Build
npm run build

# 4 — Run
node build/index.js
```

## Features

| Area | Tools |
|------|-------|
| **Repositories** | `list_repositories`, `list_projects`, `list_branches`, `list_tags`, `get_branch_commits`, `clone_repository` |
| **Branches** | `create_branch` |
| **Pull Requests** | `create_pull_request`, `list_pull_requests`, `get_pull_request`, `approve_pull_request`, `decline_pull_request`, `merge_pull_request`, `get_pull_request_comments`, `add_pull_request_comment` |
| **Deployments** | `list_deployments`, `get_deployment` |

## Configuration

### Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BITBUCKET_API_TOKEN` | Yes* | — | [API token](https://support.atlassian.com/bitbucket-cloud/docs/create-a-repository-access-token/) (Bearer auth — recommended) |
| `BITBUCKET_USERNAME` | Yes* | — | Bitbucket account email (Basic auth — legacy) |
| `BITBUCKET_APP_PASSWORD` | Yes* | — | [App Password](https://bitbucket.org/account/settings/app-passwords/) (Basic auth — legacy) |
| `BITBUCKET_WORKSPACE` | Yes | — | Workspace slug |
| `BITBUCKET_API_URL` | No | `https://api.bitbucket.org/2.0` | API base URL (override for testing) |
| `MCP_TRANSPORT` | No | `stdio` | `stdio` (local dev) or `http` (VPC service) |
| `MCP_PORT` | No | `3000` | HTTP server port (only when `MCP_TRANSPORT=http`) |
| `MCP_HOST` | No | `0.0.0.0` | HTTP server bind address |
| `LOG_LEVEL` | No | `info` | `fatal`, `error`, `warn`, `info`, `debug`, `trace` |
| `NODE_ENV` | No | `production` | `development`, `production`, `test` |

> **\*** Authentication: set `BITBUCKET_API_TOKEN` **or** both `BITBUCKET_USERNAME` + `BITBUCKET_APP_PASSWORD`. If both are provided, the API token takes priority.

### MCP client configuration

#### Local (stdio — default)

Add this to your MCP client settings (VS Code, Claude Desktop, etc.):

```json
{
  "mcpServers": {
    "bitbucket": {
      "command": "node",
      "args": ["/path/to/bitbucket-mcp-server/build/index.js"],
      "env": {
        "BITBUCKET_API_TOKEN": "your-api-token",
        "BITBUCKET_WORKSPACE": "your-workspace"
      },
      "transportType": "stdio"
    }
  }
}
```

#### Remote (HTTP — VPC service)

Deploy the server with `MCP_TRANSPORT=http` and point clients to the HTTP endpoint:

```json
{
  "mcpServers": {
    "bitbucket": {
      "url": "http://your-mcp-host:3000/mcp",
      "transportType": "http"
    }
  }
}
```

The HTTP server exposes:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check (ALB/ECS probes) |
| `/mcp` | POST | MCP JSON-RPC requests |
| `/mcp` | GET | SSE stream for server-initiated messages |
| `/mcp` | DELETE | Session termination |

### Creating a Bitbucket App Password

> **Note:** Bitbucket is deprecating App Passwords. Prefer **API tokens** (Repository or Workspace Access Tokens) for new setups.

1. Go to <https://bitbucket.org/account/settings/app-passwords/>
2. Click **Create app password**
3. Select permissions:
   - **Repositories**: Read, Write, Admin
   - **Pull requests**: Read, Write
   - **Account**: Read
4. Copy the generated password

## Development

### Prerequisites

- **Node.js 24+**
- npm

### Scripts

```bash
npm run build          # Compile TypeScript → build/
npm run dev            # Watch mode (tsc --watch)
npm run typecheck      # Type-check without emitting
npm run lint           # ESLint
npm run lint:fix       # ESLint with auto-fix
npm run format         # Prettier write
npm run format:check   # Prettier check
npm run test           # Vitest (single run)
npm run test:watch     # Vitest (watch)
npm run test:coverage  # Vitest with coverage
npm run inspector      # MCP Inspector UI
```

### Project structure

```
src/
├── index.ts               # Entry-point — McpServer setup & tool registration
├── config.ts              # Zod-validated environment config (singleton)
├── logger.ts              # Pino structured logger
├── httpClient.ts          # Axios instance w/ retry, rate-limit logging
├── errors.ts              # Custom error hierarchy
├── schemas.ts             # Zod input schemas for every tool
├── types.ts               # Bitbucket API response interfaces
├── *.test.ts              # Unit tests (Vitest)
└── handlers/
    ├── repository.ts      # Repos, branches, tags, commits, clone
    ├── branch.ts          # Branch creation
    ├── pullRequest.ts     # PR CRUD, review, merge, comments
    └── deployment.ts      # Deployment listing & details
```

### Architecture highlights

- **MCP SDK 1.x high-level API** — uses `McpServer.tool()` with native Zod schema registration (no manual JSON-Schema).
- **Zod everywhere** — config validated at startup; tool inputs validated per-request.
- **Structured logging** — pino with JSON output in production, pretty-print in development.
- **Automatic retries** — axios-retry with exponential back-off for 429 / 5xx / network errors.
- **Rate-limit awareness** — logs warnings when Bitbucket `X-RateLimit-Remaining` drops below threshold.
- **Custom error classes** — `ValidationError`, `BitbucketApiError`, `NotFoundError`, `ConfigError`.
- **No `any`** — fully typed handlers and schemas.

## Docker

The Dockerfile defaults to HTTP mode (`MCP_TRANSPORT=http`) for containerised deployments.

```bash
# Build
docker build -t bitbucket-mcp-server .

# Run (HTTP mode — default in Docker)
docker run --env-file .env -p 3000:3000 bitbucket-mcp-server
```

Or using Docker Compose:

```bash
docker compose up
```

The Dockerfile uses a multi-stage build with `node:24-slim`, runs as a non-root user, and includes a `HEALTHCHECK` instruction.

## Reliability

| Concern | How it's handled |
|---------|------------------|
| Transient API failures | 3 retries w/ exponential back-off (1 s → 2 s → 4 s) |
| Rate limiting | 429 responses are retried; `X-RateLimit-*` headers are logged |
| Invalid input | Zod rejects bad input before any API call is made |
| Missing config | Startup fails fast with a clear error listing all missing variables |
| Graceful shutdown | SIGINT / SIGTERM handlers close the MCP connection cleanly |
| Dual transport | `stdio` for local dev, `http` for VPC — same codebase |

## License

MIT

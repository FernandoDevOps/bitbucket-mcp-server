# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.2.1] - 2026-03-11

### Fixed
- **HTTP transport multi-session crash** — `McpServer.connect()` threw `"Already connected to a transport"` when a second client session was created; each HTTP session now gets its own `McpServer` instance via a `createServer()` factory
- **Session storage race condition** — session ID was read before the `initialize` handshake completed, so transports were never stored; now uses `onsessioninitialized` callback for reliable storage
- **`isInitializeRequest` guard** — new session creation is now gated on the request actually being an `initialize` call, matching the SDK's recommended pattern

### Changed
- **Refactored tool registration** — extracted into `registerTools(server)` / `createServer()` factory so both stdio and HTTP transports share the same tool setup code
- **Graceful shutdown** — now tracks and closes all active HTTP session servers

## [1.2.0] - 2026-03-11

### Added
- **Bitbucket API token support** — new `BITBUCKET_API_TOKEN` env var for Bearer auth (Repository / Workspace Access Tokens)
- **Flexible authentication** — set `BITBUCKET_API_TOKEN` *or* `BITBUCKET_USERNAME` + `BITBUCKET_APP_PASSWORD`; API token takes priority when both are present
- **Auth method logging** — startup log shows whether `api-token` or `app-password` auth is active
- **GitHub Actions CI** — `.github-public/workflows/ci.yml` ships with the public repo (Node 22 + 24 matrix, Docker build)
- **GitHub sync script** — `scripts/sync-to-github.sh` exports, sanitises, and pushes to the public GitHub repo

### Changed
- **Config validation** — Zod `.refine()` ensures at least one auth method is provided; clear error message when neither is set
- **`httpClient.ts`** — conditionally sets `Authorization: Bearer` or Basic auth based on config
- **`PullRequestHandlers`** — `username` constructor param now optional (was unused)
- **README** — updated env table with auth options, deprecation note for App Passwords, API token in MCP client example
- **`.env.example`** — documents both authentication methods

## [1.1.0] - 2026-03-05
# 1. Commit & push to Bitbucket
git add -A && git commit -m "feat: add Bitbucket API token auth support" && git push origin master

# 2. Sync sanitised version to GitHub
./scripts/sync-to-github.sh
### Added
- **Dual transport support** — server can now run as either stdio (local dev) or HTTP (VPC service), controlled by `MCP_TRANSPORT` env var
- **Streamable HTTP transport** — full MCP Streamable HTTP spec with per-session state, SSE streaming, and session termination
- **Health check endpoint** — `GET /health` returns `{ status: "ok" }` for ALB/ECS health probes
- **New config vars** — `MCP_TRANSPORT` (`stdio` | `http`), `MCP_PORT` (default 3000), `MCP_HOST` (default 0.0.0.0)
- **Express 5** — added as production dependency (used by HTTP transport)
- **Dockerfile HEALTHCHECK** — built-in Docker health check instruction for container orchestration
- **Buildkite CI pipeline** — `.buildkite/pipeline.yml` with three stages: validate (typecheck + lint + test), temp image (feature branches), and release image (master)
- **Buildkite scripts** — `validate.sh`, `build-temp-image.sh`, `build-image.sh` following cicd-scripts conventions

### Changed
- **Dockerfile** defaults to HTTP mode (`MCP_TRANSPORT=http`) with `EXPOSE 3000`
- **docker-compose.yml** — ports mapping and health check for HTTP mode
- **README** — added HTTP transport docs, VPC deployment guide, endpoint reference table

## [1.0.0] - 2026-03-05

### Breaking Changes
- **Node.js 24 minimum** — `engines.node` now requires `>=24.0.0`
- **MCP SDK 1.x** — Upgraded from `0.6.0` to `1.27.1`; uses the high-level `McpServer` API instead of the low-level `Server` class
- **Removed `src/tools.ts`** — Manual JSON-Schema tool definitions replaced by Zod schemas in `src/schemas.ts`, registered directly via `McpServer.tool()`

### Added
- **Zod v4 input validation** on all 17 tools with typed schemas (`src/schemas.ts`)
- **Structured logging** via Pino (`src/logger.ts`) — JSON in production, pretty-print in development; child loggers per handler module
- **Configuration module** (`src/config.ts`) — Zod-validated env vars with fail-fast startup errors listing all missing variables
- **Custom error hierarchy** (`src/errors.ts`) — `AppError`, `BitbucketApiError`, `ValidationError`, `ConfigError`, `NotFoundError` with status codes
- **HTTP client with retry** (`src/httpClient.ts`) — Axios singleton with `axios-retry` (3 retries, exponential backoff 1s→2s→4s for 429/5xx/network errors), rate-limit header awareness
- **ESLint flat config** (`eslint.config.js`) — `typescript-eslint` + Prettier integration, `no-explicit-any: error`
- **Prettier** (`.prettierrc`) — single quotes, trailing commas, 100 char width
- **Vitest test scaffold** — 15 tests across `config.test.ts`, `errors.test.ts`, `schemas.test.ts`
- **Docker support** — multi-stage `Dockerfile` with `node:24-slim`, non-root user (`mcp:1001`); `docker-compose.yml` with `env_file`
- **`.env.example`** — documents all environment variables
- **Expanded `.gitignore`** — coverage, IDE, OS, build patterns

### Changed
- **All handlers fully typed** — removed every `any`; all params use Zod inferred types, all returns are `Promise<CallToolResult>`
- **Entry point rewritten** (`src/index.ts`) — tool registration via `server.tool(name, description, schema, handler)` with graceful shutdown on SIGINT/SIGTERM
- **`tsconfig.json`** — target `ES2024`, `NodeNext` module resolution
- **`package.json`** — version `1.0.0`, `engines: { node: ">=24.0.0" }`, new scripts: `dev`, `start`, `typecheck`, `lint`, `lint:fix`, `format`, `format:check`, `test`, `test:coverage`

### Removed
- `src/tools.ts` — superseded by `src/schemas.ts`
- All implicit `any` types across the codebase

### Migration from 0.5.0

1. Ensure **Node.js ≥ 24** is installed
2. Run `npm install` (dependencies changed significantly)
3. Run `npm run build`
4. Set environment variables per `.env.example` (same vars as before — `BITBUCKET_USERNAME`, `BITBUCKET_APP_PASSWORD`, `BITBUCKET_WORKSPACE`)
5. Restart your MCP server

All 17 tools remain the same — no changes to tool names or parameters. Existing MCP client configurations work without modification.

## [0.5.0] - 2025-07-03

### Added
- **Repository Cloning**: SSH and HTTPS repository cloning support
  - `clone_repository` - Generate git clone commands with SSH (default) or HTTPS protocol
  - Support for specific branch cloning with `--branch` parameter
  - Custom directory naming for cloned repositories
  - SSH setup instructions and prerequisites for secure cloning
  - Complete git command generation ready for terminal execution
  - Repository verification before generating clone commands

### Enhanced
- **Protocol Flexibility**: SSH protocol as default for secure cloning with HTTPS fallback option
- **Branch-Specific Cloning**: Support for cloning specific branches directly
- **User Experience**: Comprehensive clone instructions with setup guidance for SSH
- **Error Handling**: Repository validation and detailed error messages for clone operations

### Technical Improvements
- Updated version to 0.5.0 across all files
- Added new API endpoint integration for repository clone URLs
- Enhanced TypeScript interfaces for clone URL data structures
- Improved Bitbucket API response parsing for clone links
- Added comprehensive SSH setup documentation

### Code Structure Improvements
- **Modular Architecture**: Refactored monolithic index.ts into logical, maintainable modules
- **Separation of Concerns**: Split code into dedicated handler classes by functionality
  - `src/types.ts` - Centralized TypeScript interfaces and type definitions
  - `src/tools.ts` - MCP tool schema definitions and configurations
  - `src/handlers/repository.ts` - Repository operations (list, clone, branches, tags, commits)
  - `src/handlers/branch.ts` - Branch operations (create branch)
  - `src/handlers/pullRequest.ts` - Pull request operations (create, list, approve, merge, comments)
  - `src/handlers/deployment.ts` - Deployment operations (list, get details)
  - `src/index.ts` - Main server orchestrator using modular handlers
- **Improved Maintainability**: Each module has single responsibility, making code easier to navigate and modify
- **Enhanced Readability**: Clean imports and organized file structure for better developer experience
- **Scalable Design**: Easy to extend functionality by adding new handlers or modifying existing ones
- **Consistent Error Handling**: Centralized error management in main server class
- **Dependency Injection**: Handler classes receive dependencies via constructor for better testability

### Usage Examples
- Generate SSH clone commands (recommended and default)
- Generate HTTPS clone commands for environments without SSH setup
- Clone specific branches directly without additional git operations
- Custom directory naming for better project organization
- Complete workflow integration for repository setup

## [0.4.0] - 2025-02-07

### Added
- **Project Management**: New project-related functionality for enhanced workspace organization
  - `list_projects` - List all projects in the workspace with comprehensive project information
  - Project filtering support for `list_repositories` - Filter repositories by project key
  - Project metadata including key, name, description, privacy status, owner information
  - Direct links to projects in Bitbucket web interface

### Enhanced
- **Repository Filtering**: Enhanced `list_repositories` tool with optional project parameter
  - Added `project` parameter for filtering repositories by project key
  - Uses Bitbucket query API (`q=project.key="PROJECT_KEY"`) for precise filtering
  - Maintains backward compatibility - project parameter is optional
  - Returns filter information in response showing which project was used

### Technical Improvements
- Updated version to 0.4.0 across all files
- Added new API endpoint integration: `/workspaces/{workspace}/projects`
- Enhanced TypeScript interfaces for project data structures
- Improved error handling for project-related API responses
- Updated documentation with project management examples

### Usage Examples
- List all projects in workspace for better organization visibility
- Filter repositories by specific project for focused development workflows
- Enhanced project-based repository management
- Better workspace organization and navigation

## [0.3.0] - 2025-07-01

### Added
- **Deployment Management**: New deployment monitoring and management capabilities
  - `list_deployments` - List all deployments for a repository with optional environment filtering
  - `get_deployment` - Get detailed information about specific deployments by UUID
  - Support for deployment state tracking (UNDEPLOYED, IN_PROGRESS, SUCCESSFUL, FAILED, STOPPED)
  - Environment-based deployment filtering
  - Complete deployment metadata including release and commit information
  ***Be aware that bitbucket does not provide a way to get the most recent deployments, so we need to fetch a lot of data and filter it ourselves. This can be slow for large repositories with many deployments, basically makes the deployment functionality unusable for large repositories.***

### Enhanced
- **Deployment Interface**: New `BitbucketDeployment` TypeScript interface for type safety
- **API Coverage**: Extended Bitbucket API coverage to include deployment endpoints
- **Pagination Support**: Consistent pagination for deployment listing operations
- **Error Handling**: Enhanced error handling for deployment-specific API responses

### Technical Improvements
- Updated version to 0.3.0 across all files
- Added comprehensive deployment data structures
- Enhanced TypeScript type definitions for deployment objects
- Improved API response parsing for deployment endpoints

### New Interfaces Added
- `BitbucketDeployment`: Complete deployment information structure with environment, release, and deployable details

### Usage Examples
- Monitor deployment status across environments
- Track deployment history and releases
- Analyze deployment success/failure patterns
- Environment-specific deployment management

## [0.2.1] - 2025-07-01

### Fixed
- **Pull Request Approval**: Fixed 400 Bad Request error when approving pull requests
  - Added empty request body to approve endpoint call as required by Bitbucket API
  - Enhanced approval response with timestamp for better tracking

## [0.2.0] - 2025-07-01

### Added
- **Repository Tags Support**: New `list_tags` tool for comprehensive tag management
  - List all tags in a repository with pagination
  - Get tag metadata including commit info, dates, and tagger details
  - Support for release management workflows

- **Branch Commit History**: New `get_branch_commits` tool for detailed commit analysis
  - Get complete commit history for any branch
  - Retrieve commit messages, authors, dates, and parent commits
  - Direct links to commits in Bitbucket web interface
  - Pagination support for large commit histories

- **Pull Request Comments Management**: New `get_pull_request_comments` tool
  - Retrieve all comments from any pull request
  - Get both raw text and HTML formatted content
  - Access inline code review comments with file paths and line numbers
  - Full pagination support for lengthy discussions

### Enhanced
- **Improved Documentation**: Comprehensive README.md update with detailed usage examples
- **Enhanced Error Handling**: Better error messages and API response handling
- **TypeScript Interfaces**: Added proper type definitions for all new API responses
- **Pagination Support**: Consistent pagination across all list operations

### Technical Improvements
- Updated version numbering to 0.2.0 across all files
- Enhanced TypeScript type safety with new interfaces
- Improved code organization and structure
- Better API response parsing and error handling

### New Interfaces Added
- `BitbucketTag`: Complete tag metadata structure
- `BitbucketCommit`: Comprehensive commit information
- `BitbucketComment`: Full comment data with inline support

### Usage Examples Added
- Repository analysis workflows
- Development and branching workflows  
- Code review and commenting workflows
- Release management with tags

## [0.1.0] - 2024-06-01

### Added
- **Initial Release**: Basic Bitbucket MCP Server functionality
- **Repository Management**: 
  - `list_repositories` - List repositories in workspace
  - `list_branches` - List branches in repository

- **Branch Operations**:
  - `create_branch` - Create new branches from source branches

- **Pull Request Management**:
  - `create_pull_request` - Create pull requests with reviewers
  - `list_pull_requests` - List PRs by state (OPEN, MERGED, DECLINED)
  - `get_pull_request` - Get detailed PR information
  - `add_pull_request_comment` - Add comments to pull requests

- **Pull Request Actions**:
  - `approve_pull_request` - Approve pull requests
  - `decline_pull_request` - Decline PRs with reasons  
  - `merge_pull_request` - Merge PRs with different strategies

- **Authentication & Security**:
  - Bitbucket App Password authentication
  - Environment variable configuration
  - Secure HTTPS API communication

- **Error Handling**:
  - Comprehensive API error handling
  - Authentication validation
  - Resource existence checking

### Technical Foundation
- Model Context Protocol (MCP) integration
- TypeScript implementation with proper typing
- Axios HTTP client for Bitbucket API
- Environment-based configuration
- Standard MCP server architecture

---

## Version Comparison

### What's New in 0.2.0 vs 0.1.0

**Repository Insights (NEW)**
- Tag management and release tracking
- Complete commit history analysis
- Enhanced repository exploration capabilities

**Enhanced Pull Request Workflow (IMPROVED)**
- Full comment thread retrieval and analysis
- Better code review support with inline comments
- More comprehensive PR discussion management

**Developer Experience (ENHANCED)**
- Detailed documentation with usage examples
- Better error messages and troubleshooting guide
- Improved TypeScript type safety
- Consistent pagination across all operations

**Total Tools Available**
- v0.1.0: 10 tools
- v0.2.0: 13 tools (+3 new major features)

---

## Migration Guide

### From 0.1.0 to 0.2.0

No breaking changes - all existing functionality remains the same. Simply update your installation:

1. Pull the latest code
2. Run `npm run build` 
3. Restart your MCP server

New tools are immediately available without configuration changes.

### New Environment Variables
No new environment variables required - all existing configuration remains valid.

### New Tool Usage
The new tools follow the same patterns as existing tools:
- Consistent parameter naming
- Same authentication method
- Standard JSON response format
- Same pagination patterns

---

## Roadmap

Future versions may include:
- Webhook support for real-time notifications
- Advanced search and filtering capabilities
- Batch operations for multiple repositories
- Integration with Bitbucket Pipelines
- Support for repository settings management
- File content operations (read/write repository files)

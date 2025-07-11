# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Development
- `npm run build` - Compile TypeScript to JavaScript and set executable permissions
- `npm run watch` - Run TypeScript compiler in watch mode for development
- `npm run prepare` - Pre-publish build step (runs build)
- `npm run inspector` - Run MCP inspector for debugging tools

### Testing the Server
- `node build/index.js` - Run the compiled server directly
- `npx @modelcontextprotocol/inspector build/index.js` - Debug server with MCP inspector

## Architecture Overview

This is a **Model Context Protocol (MCP) server** that bridges AI assistants with Bitbucket's REST API. The architecture follows a clean modular design:

### Core Components
- **`src/index.ts`**: Main server orchestrator with MCP setup and tool routing
- **`src/tools.ts`**: JSON schema definitions for all 16 MCP tools
- **`src/types.ts`**: TypeScript interfaces for API responses and internal types
- **`src/handlers/`**: Modular handlers for different Bitbucket operations:
  - `repository.ts`: Repository operations (list, clone, branches, tags, commits)
  - `branch.ts`: Branch creation operations
  - `pullRequest.ts`: Pull request lifecycle management
  - `deployment.ts`: Deployment monitoring and tracking

### Key Design Patterns
- **Handler Pattern**: Each logical area has its own handler class with dependency injection
- **Single Responsibility**: Each handler focuses on one domain (repos, PRs, etc.)
- **Shared Dependencies**: All handlers receive the same `AxiosInstance` and workspace configuration
- **Centralized Error Handling**: Axios errors are caught and converted to MCP errors in the main server

### Authentication Flow
The server supports two authentication methods with automatic prioritization, reading credentials from `~/.claude/settings.json` under the MCP server configuration:

**Primary: API Token Authentication (Recommended)**
- `mcpServers.bitbucket-mcp-server.env.BITBUCKET_API_TOKEN`: Bearer token with appropriate scopes
- `mcpServers.bitbucket-mcp-server.env.BITBUCKET_WORKSPACE`: Workspace/organization name
- `mcpServers.bitbucket-mcp-server.env.BITBUCKET_USERNAME`: User's email/username

**Fallback: App Password Authentication (Deprecated)**
- `mcpServers.bitbucket-mcp-server.env.BITBUCKET_USERNAME`: User's email/username
- `mcpServers.bitbucket-mcp-server.env.BITBUCKET_APP_PASSWORD`: Generated app password
- `mcpServers.bitbucket-mcp-server.env.BITBUCKET_WORKSPACE`: Workspace/organization name

**Authentication Priority**: API Token > App Password. The server will use API Token if available, otherwise fall back to App Password. Authentication validation and logging occurs at startup with detailed error reporting for troubleshooting. Environment variables are used as fallback if MCP settings are not available.

## Code Structure Patterns

### Handler Implementation
Each handler class follows this pattern:
```typescript
export class SomeHandlers {
  constructor(
    private axiosInstance: AxiosInstance,
    private workspace: string,
    private username?: string // if needed
  ) {}

  async someOperation(args: any) {
    // Implementation with this.axiosInstance calls
  }
}
```

### Tool Registration
New tools are added in three places:
1. `src/tools.ts` - JSON schema definition
2. `src/index.ts` - Handler routing in `setupToolHandlers()`
3. Appropriate handler class - Implementation method

### Error Handling
- All API errors are caught and converted to `McpError` instances
- Axios errors include HTTP status codes and response data
- Environment validation happens at startup, not runtime

## Development Notes

### Building
- TypeScript compiles to `build/` directory
- Build script sets executable permissions on `build/index.js`
- Uses ES2022 target with Node16 modules for modern Node.js compatibility

### MCP Integration
- Server runs on stdio transport (standard input/output)
- Tools are registered via JSON schemas with validation
- Responses follow MCP protocol format with proper error codes
- Authentication validation includes detailed logging for debugging connection issues

### API Integration
- Base URL: `https://api.bitbucket.org/2.0`
- All requests include JSON content-type headers
- Comprehensive pagination support across all list operations
- Repository operations are workspace-scoped

### Configuration Setup
The server reads credentials from `~/.claude/settings.json` under the MCP server configuration and will validate at startup:

**Settings.json Configuration:**
```json
{
  "mcpServers": {
    "bitbucket-mcp-server": {
      "env": {
        "BITBUCKET_USERNAME": "your-username@domain.com",
        "BITBUCKET_WORKSPACE": "your-workspace",
        "BITBUCKET_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

**Option 1: API Token Authentication (Recommended)**
- `mcpServers.bitbucket-mcp-server.env.BITBUCKET_API_TOKEN` (required)
- `mcpServers.bitbucket-mcp-server.env.BITBUCKET_WORKSPACE` (required)
- `mcpServers.bitbucket-mcp-server.env.BITBUCKET_USERNAME` (required)

**Option 2: App Password Authentication (Deprecated)**
- `mcpServers.bitbucket-mcp-server.env.BITBUCKET_USERNAME` (required)
- `mcpServers.bitbucket-mcp-server.env.BITBUCKET_APP_PASSWORD` (required)
- `mcpServers.bitbucket-mcp-server.env.BITBUCKET_WORKSPACE` (required)

The server will automatically detect and use the appropriate authentication method based on available configuration, with API Token taking priority over App Password. Environment variables are used as fallback if MCP settings are not available.

## Version History Context

This is version 0.6.0 with the most recent addition being API token authentication support alongside the existing App Password method. The codebase has evolved from a monolithic structure to the current modular handler-based architecture for better maintainability and single responsibility.

**Version 0.6.0 Changes:**
- Added API token authentication as the primary authentication method
- Implemented authentication priority system (API Token > App Password)
- Enhanced authentication validation with detailed error reporting and logging
- Maintained backward compatibility with App Password authentication
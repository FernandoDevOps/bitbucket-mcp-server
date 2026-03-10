# Component View - Bitbucket MCP Server

## Component View

### Component Diagram: MCP Server Core
**Container Overview:** The main MCP protocol server built with Node.js/TypeScript that handles incoming MCP requests, routes tool calls, and manages the communication with Bitbucket Cloud API.  

**Key Components in MCP Server Core:**  
- `MCP Request Handler` – `Server Class: Handles incoming MCP JSON-RPC requests and manages the MCP protocol lifecycle`  
- `Tool Executor` – `Service Class: Executes specific Bitbucket operations like repository management, branch creation, pull request operations, and deployment tracking`  
- `Request Validator` – `Validation Module: Validates incoming MCP requests against tool schemas and parameter requirements`  
- `Response Formatter` – `Utility Class: Formats API responses into MCP protocol-compliant responses`  
- `Error Handler` – `Error Module: Handles and formats errors from Bitbucket API and internal operations`
- `Deployment Manager` – `Service Class: Manages deployment tracking, environment mapping, and deployment history retrieval`

**Internal Interactions:** _(how components interact within MCP Server Core)_  
- `MCP Request Handler` → `Request Validator` – `Validates incoming requests before processing`  
- `MCP Request Handler` → `Tool Executor` – `Delegates tool execution requests based on tool name`  
- `Tool Executor` → `Bitbucket API Client` – `Makes authenticated API calls to perform operations`  
- `Tool Executor` → `Deployment Manager` – `Handles deployment-specific operations and environment filtering`  
- `Tool Executor` → `Response Formatter` – `Formats successful operation results`  
- `Error Handler` → `Response Formatter` – `Formats error responses for MCP protocol`
- `Deployment Manager` → `Bitbucket API Client` – `Makes deployment and environment API calls`

```mermaid
C4Component
    title Component Diagram - MCP Server Core

    System_Ext(mcpClient, "MCP Client", "AI assistant application")
    System_Ext(bitbucketCloud, "Bitbucket Cloud API", "Git repository platform")
    Container_Ext(apiClient, "Bitbucket API Client", "Axios HTTP Client", "REST API client")
    Container_Ext(toolRegistry, "Tool Registry", "TypeScript Module", "Tool definitions")
    Container_Ext(authManager, "Authentication Manager", "Environment Config", "Credentials")

    Container_Boundary(mcpCoreBoundary, "MCP Server Core") {
        Component(requestHandler, "MCP Request Handler", "Server Class", "Handles MCP JSON-RPC protocol")
        Component(toolExecutor, "Tool Executor", "Service Class", "Executes Bitbucket operations")
        Component(deploymentManager, "Deployment Manager", "Service Class", "Manages deployment tracking")
        Component(requestValidator, "Request Validator", "Validation Module", "Validates MCP requests")
        Component(responseFormatter, "Response Formatter", "Utility Class", "Formats MCP responses")
        Component(errorHandler, "Error Handler", "Error Module", "Handles operation errors")
    }

    Rel(mcpClient, requestHandler, "MCP requests")
    Rel(requestHandler, requestValidator, "Validates requests")
    Rel(requestHandler, toolExecutor, "Executes tools")
    Rel(toolExecutor, deploymentManager, "Deployment operations")
    Rel(toolExecutor, apiClient, "API calls")
    Rel(deploymentManager, apiClient, "Deployment API calls")
    Rel(toolExecutor, responseFormatter, "Format results")
    Rel(errorHandler, responseFormatter, "Format errors")
    Rel(toolExecutor, toolRegistry, "Get schemas")
    Rel(apiClient, authManager, "Get credentials")

# Code-Level Details - Bitbucket MCP Server

## Code-Level Details

### Class Diagram
**Core Classes:** The main classes that implement the MCP server functionality for Bitbucket integration, including server management, API client operations, and data models.

### Sequence Diagram
**Pull Request Creation Flow:** Shows the sequence of interactions when an AI assistant creates a pull request through the MCP server, including authentication, validation, and API communication.

```mermaid
classDiagram
    class BitbucketMCPServer {
        +server: Server
        +apiClient: AxiosInstance
        +workspace: string
        +start(): Promise~void~
        +setupToolHandlers(): void
        +handleListRepositories(args): Promise~object~
        +handleCreateBranch(args): Promise~object~
        +handleCreatePullRequest(args): Promise~object~
        +handleListPullRequests(args): Promise~object~
        +handleListDeployments(args): Promise~object~
        +handleGetDeployment(args): Promise~object~
    }

    class ToolHandler {
        +apiClient: AxiosInstance
        +workspace: string
        +listRepositories(page, pagelen): Promise~BitbucketRepository[]~
        +listBranches(repository): Promise~BitbucketBranch[]~
        +createBranch(repository, branchName, sourceBranch): Promise~object~
        +createPullRequest(repository, title, description, sourceBranch, destinationBranch): Promise~object~
        +listPullRequests(repository, state): Promise~BitbucketPullRequest[]~
        +listDeployments(repository, environment): Promise~BitbucketDeployment[]~
        +getDeployment(repository, deploymentUuid): Promise~BitbucketDeployment~
    }

    class BitbucketRepository {
        +name: string
        +full_name: string
        +uuid: string
        +is_private: boolean
        +description: string
    }

    class BitbucketBranch {
        +name: string
        +target: object
        +hash: string
        +message: string
    }

    class BitbucketPullRequest {
        +id: number
        +title: string
        +description: string
        +state: string
        +source: object
        +destination: object
        +author: object
        +created_on: string
    }

    class BitbucketDeployment {
        +uuid: string
        +number: number
        +created_on: string
        +state: object
        +environment: object
        +deployable: object
        +release: object
    }

    class AuthenticationConfig {
        +username: string
        +appPassword: string
        +workspace: string
        +validateCredentials(): boolean
        +getAuthHeaders(): object
    }

    BitbucketMCPServer --> ToolHandler
    BitbucketMCPServer --> AuthenticationConfig
    ToolHandler --> BitbucketRepository
    ToolHandler --> BitbucketBranch
    ToolHandler --> BitbucketPullRequest
    ToolHandler --> BitbucketDeployment
```

```mermaid
sequenceDiagram
    participant AI as AI Assistant
    participant MCP as MCP Server
    participant TH as Tool Handler
    participant API as Bitbucket API
    participant Auth as Auth Config

    AI->>MCP: createPullRequest({repository, title, description, source_branch, destination_branch})
    MCP->>MCP: Validate request schema
    MCP->>TH: handleCreatePullRequest(args)
    TH->>Auth: getAuthHeaders()
    Auth-->>TH: {Authorization: "Basic ..."}
    TH->>API: POST /repositories/{workspace}/{repo}/pullrequests
    API-->>TH: Pull request created response
    TH->>TH: Format response for MCP
    TH-->>MCP: Formatted pull request data
    MCP-->>AI: MCP tool response with pull request details

    Note over AI,API: Deployment tracking flow
    AI->>MCP: listDeployments({repository, environment})
    MCP->>TH: handleListDeployments(args)
    TH->>API: GET /repositories/{workspace}/{repo}/environments
    TH->>API: GET /repositories/{workspace}/{repo}/deployments
    API-->>TH: Deployment data with environment mapping
    TH->>TH: Filter by environment and format response
    TH-->>MCP: Formatted deployment list
    MCP-->>AI: MCP tool response with deployment details

    Note over AI,API: Error handling flow
    API-->>TH: Error response (e.g., 400, 401, 404)
    TH->>TH: Handle API error
    TH-->>MCP: Formatted error response
    MCP-->>AI: MCP error response

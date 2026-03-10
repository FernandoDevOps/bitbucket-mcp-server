# System Context - Bitbucket MCP Server

## System Context
**System Name:** Bitbucket MCP Server  
**System Description:** A Model Context Protocol server that enables AI assistants to interact with Bitbucket repositories, providing repository management, branch operations, pull request creation and management, and deployment tracking capabilities.

**External Actors:** _(Who uses or interacts with the system?)_  
- `AI Assistant` – Uses the MCP server to perform Bitbucket operations on behalf of developers through natural language interactions  
- `Developer` – Indirectly uses the system through AI assistants for repository management, code reviews, deployment monitoring, and collaboration workflows  

**External Systems:** _(Systems this one integrates with)_  
- `Bitbucket Cloud API` – Cloud-based Git repository hosting platform that provides REST APIs for repository, branch, pull request, deployment, and environment management  
- `MCP Client` – AI assistant applications (Claude, ChatGPT, etc.) that connect to MCP servers to extend their capabilities with external tool integrations  

```mermaid
C4Context
    title System Context - Bitbucket MCP Server

    Person(aiAssistant, "AI Assistant", "Claude, ChatGPT, or other AI that uses MCP protocol to interact with Bitbucket")
    Person(developer, "Developer", "Software developer using AI assistant for repository operations, deployment monitoring, and code collaboration")
    
    System(bitbucketMCP, "Bitbucket MCP Server", "MCP server providing comprehensive Bitbucket integration for AI assistants with repository, pull request, and deployment management")
    
    System_Ext(bitbucketCloud, "Bitbucket Cloud API", "Git repository hosting platform with REST APIs for repositories, branches, pull requests, deployments, and environments")
    System_Ext(mcpClient, "MCP Client", "AI assistant application with MCP protocol support")
    
    Rel(aiAssistant, mcpClient, "Uses for code assistance")
    Rel(developer, aiAssistant, "Requests repository and deployment operations")
    Rel(mcpClient, bitbucketMCP, "MCP protocol communication")
    Rel(bitbucketMCP, bitbucketCloud, "HTTPS REST API calls")

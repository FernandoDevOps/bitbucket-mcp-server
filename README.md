# Bitbucket MCP Server

A Model Context Protocol (MCP) server that provides comprehensive tools for interacting with Bitbucket repositories through the Bitbucket API. This server enables agents to perform repository operations, manage branches, handle pull requests, analyze commit history, work with repository tags, and monitor deployments.

## Version 0.6.0

## Features

### Repository Management
- List repositories in your workspace
- Browse repository branches
- List repository tags with detailed information
- Get commit history for any branch
- Clone repositories using SSH (default) or HTTPS protocol

### Branch Operations
- Create new branches from any source branch
- List all branches in a repository
- View detailed commit history and messages for branches

### Pull Request Management
- Create pull requests with reviewers
- List pull requests by state (OPEN, MERGED, DECLINED)
- Get detailed pull request information
- Retrieve all comments from pull requests
- Add comments to pull requests

### Pull Request Reviews & Actions
- Approve pull requests
- Decline pull requests with reasons
- Merge pull requests with different strategies
- Close source branches after merging

### Deployment Management
- List all deployments for a repository
- Filter deployments by environment
- Get detailed deployment information
- Monitor deployment status and state
- Track deployment history and releases

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Bitbucket account with repository access
- Bitbucket API Token (recommended) or App Password (deprecated but still supported)

### Setup

1. **Clone/Create the server:**
   ```bash
   cd /path/to/your/mcp/servers
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the server:**
   ```bash
   npm run build
   ```

4. **Create Bitbucket API Token (Recommended):**
   - Go to https://bitbucket.org/account/settings/app-passwords/
   - Click "Create app password"
   - Give it a descriptive name (e.g., "MCP Server Token")
   - Select the following scopes:
     - **Repositories**: Read, Write, Admin
     - **Pull requests**: Read, Write
     - **Account**: Read
   - Copy the generated token

   **Note**: While called "app password" in the UI, this creates an API token that's more secure than traditional App Passwords.

5. **Alternative: App Password (Deprecated but Still Supported):**
   - Legacy App Passwords continue to work for backward compatibility
   - However, API tokens are recommended for better security and features
   - See the Migration Guide below to upgrade from App Passwords to API tokens

## Configuration

### MCP Settings
Add the server to your MCP configuration file:

**With API Token (Recommended):**
```json
{
  "mcpServers": {
    "bitbucket-mcp-server": {
      "autoApprove": [],
      "disabled": false,
      "timeout": 60,
      "command": "node",
      "args": ["/path/to/bitbucket-mcp-server/build/index.js"],
      "env": {
        "BITBUCKET_USERNAME": "your-username@domain.com",
        "BITBUCKET_API_TOKEN": "your-api-token",
        "BITBUCKET_WORKSPACE": "your-workspace-name"
      },
      "transportType": "stdio"
    }
  }
}
```

**With App Password (Deprecated but Still Supported):**
```json
{
  "mcpServers": {
    "bitbucket-mcp-server": {
      "autoApprove": [],
      "disabled": false,
      "timeout": 60,
      "command": "node",
      "args": ["/path/to/bitbucket-mcp-server/build/index.js"],
      "env": {
        "BITBUCKET_USERNAME": "your-username@domain.com",
        "BITBUCKET_APP_PASSWORD": "your-app-password",
        "BITBUCKET_WORKSPACE": "your-workspace-name"
      },
      "transportType": "stdio"
    }
  }
}
```

### Environment Variables

**For API Token Authentication (Recommended):**
- `BITBUCKET_USERNAME`: Your Bitbucket username/email
- `BITBUCKET_API_TOKEN`: Your Bitbucket API Token
- `BITBUCKET_WORKSPACE`: Your workspace/organization name

**For App Password Authentication (Deprecated but Supported):**
- `BITBUCKET_USERNAME`: Your Bitbucket username/email
- `BITBUCKET_APP_PASSWORD`: Your Bitbucket App Password
- `BITBUCKET_WORKSPACE`: Your workspace/organization name

**Note**: Use either `BITBUCKET_API_TOKEN` or `BITBUCKET_APP_PASSWORD`, not both. API tokens are recommended for better security and future-proofing.

## Available Tools

### Repository Management Tools

#### 1. list_repositories
List repositories in your workspace with pagination support and optional project filtering.

**Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `pagelen` (optional): Number of repositories per page (default: 10, max: 100)
- `project` (optional): Filter repositories by project key

**Example:**
```json
{
  "page": 1,
  "pagelen": 20
}
```

**Example with project filter:**
```json
{
  "page": 1,
  "pagelen": 20,
  "project": "MYPROJ"
}
```

**Returns:**
- Repository name, full name, and privacy status
- Repository description
- Filter information showing which project was used (if any)
- Pagination details

#### 2. list_projects
List all projects in the workspace with pagination support.

**Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `pagelen` (optional): Number of projects per page (default: 10, max: 100)

**Example:**
```json
{
  "page": 1,
  "pagelen": 20
}
```

**Returns:**
- Project key, name, and description
- Project privacy status and creation/update dates
- Project owner information
- Direct link to project in Bitbucket
- Pagination details

#### 3. list_branches
List all branches in a specific repository.

**Parameters:**
- `repository` (required): Repository name

**Example:**
```json
{
  "repository": "my-awesome-project"
}
```

#### 4. list_tags
List all tags in a repository with detailed information.

**Parameters:**
- `repository` (required): Repository name
- `page` (optional): Page number for pagination (default: 1)
- `pagelen` (optional): Number of tags per page (default: 10, max: 100)

**Example:**
```json
{
  "repository": "my-awesome-project",
  "page": 1,
  "pagelen": 25
}
```

**Returns:**
- Tag name and commit information
- Commit hash and message
- Commit date
- Tagger information (if available)

#### 5. get_branch_commits
Get detailed commit history for any branch.

**Parameters:**
- `repository` (required): Repository name
- `branch` (required): Branch name (e.g., "main", "develop")
- `page` (optional): Page number for pagination (default: 1)
- `pagelen` (optional): Number of commits per page (default: 10, max: 100)

**Example:**
```json
{
  "repository": "my-awesome-project",
  "branch": "main",
  "page": 1,
  "pagelen": 20
}
```

**Returns:**
- Commit hash, message, and date
- Author information
- Parent commit hashes
- Direct link to commit in Bitbucket

### Branch Operations

#### 6. create_branch
Create a new branch in a repository.

**Parameters:**
- `repository` (required): Repository name
- `branch_name` (required): Name for the new branch
- `source_branch` (optional): Source branch to create from (default: "main")

**Example:**
```json
{
  "repository": "my-awesome-project",
  "branch_name": "feature/user-authentication",
  "source_branch": "develop"
}
```

### Pull Request Management

#### 7. create_pull_request
Create a new pull request.

**Parameters:**
- `repository` (required): Repository name
- `title` (required): Pull request title
- `source_branch` (required): Source branch name
- `description` (optional): Pull request description
- `destination_branch` (optional): Destination branch (default: "main")
- `reviewers` (optional): Array of reviewer usernames

**Example:**
```json
{
  "repository": "my-awesome-project",
  "title": "Add user authentication feature",
  "description": "This PR implements OAuth2 authentication with Google and GitHub providers.",
  "source_branch": "feature/user-authentication",
  "destination_branch": "develop",
  "reviewers": ["john.doe", "jane.smith"]
}
```

#### 7. list_pull_requests
List pull requests in a repository.

**Parameters:**
- `repository` (required): Repository name
- `state` (optional): Filter by state - "OPEN", "MERGED", "DECLINED" (default: "OPEN")
- `page` (optional): Page number for pagination (default: 1)

**Example:**
```json
{
  "repository": "my-awesome-project",
  "state": "OPEN",
  "page": 1
}
```

#### 8. get_pull_request
Get detailed information about a specific pull request.

**Parameters:**
- `repository` (required): Repository name
- `pull_request_id` (required): Pull request ID

**Example:**
```json
{
  "repository": "my-awesome-project",
  "pull_request_id": 42
}
```

#### 9. get_pull_request_comments
Get all comments from a pull request.

**Parameters:**
- `repository` (required): Repository name
- `pull_request_id` (required): Pull request ID
- `page` (optional): Page number for pagination (default: 1)
- `pagelen` (optional): Number of comments per page (default: 20, max: 100)

**Example:**
```json
{
  "repository": "my-awesome-project",
  "pull_request_id": 42,
  "page": 1,
  "pagelen": 50
}
```

**Returns:**
- Comment ID, content (raw and HTML)
- Author information
- Creation and update timestamps
- Direct link to comment
- Inline comment details (file path, line numbers) if applicable

#### 10. add_pull_request_comment
Add a comment to a pull request.

**Parameters:**
- `repository` (required): Repository name
- `pull_request_id` (required): Pull request ID
- `content` (required): Comment content

**Example:**
```json
{
  "repository": "my-awesome-project",
  "pull_request_id": 42,
  "content": "Great work! Just a few minor suggestions: consider adding unit tests for the new authentication methods."
}
```

### Pull Request Actions

#### 11. approve_pull_request
Approve a pull request.

**Parameters:**
- `repository` (required): Repository name
- `pull_request_id` (required): Pull request ID

**Example:**
```json
{
  "repository": "my-awesome-project",
  "pull_request_id": 42
}
```

#### 12. decline_pull_request
Decline a pull request.

**Parameters:**
- `repository` (required): Repository name
- `pull_request_id` (required): Pull request ID
- `reason` (optional): Reason for declining

**Example:**
```json
{
  "repository": "my-awesome-project",
  "pull_request_id": 42,
  "reason": "Code doesn't meet our quality standards. Please address the linting issues."
}
```

#### 13. merge_pull_request
Merge a pull request.

**Parameters:**
- `repository` (required): Repository name
- `pull_request_id` (required): Pull request ID
- `merge_strategy` (optional): "merge_commit", "squash", or "fast_forward" (default: "merge_commit")
- `close_source_branch` (optional): Whether to close source branch after merge (default: false)

**Example:**
```json
{
  "repository": "my-awesome-project",
  "pull_request_id": 42,
  "merge_strategy": "squash",
  "close_source_branch": true
}
```

### Deployment Management

#### 14. list_deployments
List deployments for a repository with optional environment filtering.

**Parameters:**
- `repository` (required): Repository name
- `environment` (optional): Filter by environment name
- `page` (optional): Page number for pagination (default: 1)
- `pagelen` (optional): Number of deployments per page (default: 10, max: 100)

**Example:**
```json
{
  "repository": "my-awesome-project",
  "environment": "production",
  "page": 1,
  "pagelen": 20
}
```

**Returns:**
- Deployment UUID, key, and name
- Deployment state (UNDEPLOYED, IN_PROGRESS, SUCCESSFUL, FAILED, STOPPED)
- Environment information
- Release details with commit information
- Last update time
- Deployable information

#### 15. get_deployment
Get detailed information about a specific deployment.

**Parameters:**
- `repository` (required): Repository name
- `deployment_uuid` (required): Deployment UUID

**Example:**
```json
{
  "repository": "my-awesome-project",
  "deployment_uuid": "12345678-1234-1234-1234-123456789abc"
}
```

**Returns:**
- Complete deployment information
- Environment details
- Release and commit information
- Deployment state and timing
- Links to related resources

### Repository Cloning

#### 16. clone_repository
Get repository clone information and generate git clone commands using SSH (default) or HTTPS protocol.

**Parameters:**
- `repository` (required): Repository name
- `directory` (optional): Local directory to clone into (defaults to repository name)
- `protocol` (optional): Protocol to use - "ssh" or "https" (default: "ssh")
- `branch` (optional): Specific branch to clone

**Example - SSH cloning (default):**
```json
{
  "repository": "my-awesome-project",
  "directory": "my-local-project",
  "protocol": "ssh"
}
```

**Example - HTTPS cloning:**
```json
{
  "repository": "my-awesome-project",
  "directory": "my-local-project",
  "protocol": "https"
}
```

**Example - Clone specific branch:**
```json
{
  "repository": "my-awesome-project",
  "branch": "develop",
  "protocol": "ssh"
}
```

**Returns:**
- Repository information (name, full name)
- Clone URL for the specified protocol
- Complete git clone command ready to execute
- SSH setup instructions (for SSH protocol)
- Target directory information

**SSH Prerequisites (for SSH protocol):**
1. SSH keys configured in your Bitbucket account
2. SSH agent running with your key loaded
3. Bitbucket.org added to your known_hosts

The tool provides the complete git clone command that you can copy and execute in your terminal.

## Usage Examples

### Repository Analysis Workflow
```bash
# List all repositories
"List all repositories in our workspace"

# List repositories filtered by project
"List repositories in project 'MYPROJECT'"

# Analyze a specific repository
"Show me all branches in the 'myrepo-api' repository"
"List all tags in the 'myrepo-api' repository"
"Get the last 20 commits from the 'main' branch in 'myrepo-api'"
```

### Development Workflow
```bash
# 1. Check commit history
"Show me the recent commits on the 'develop' branch in 'myrepo-api'"

# 2. Create a new feature branch
"Create a branch called 'feature/payment-improvements' in the 'myrepo-api' repository from the 'develop' branch"

# 3. Create a pull request
"Create a pull request in 'myrepo-api' from 'feature/payment-improvements' to 'develop' with title 'Improve payment processing speed' and add 'john.doe' as reviewer"
```

### Code Review Workflow
```bash
# List open PRs
"List all open pull requests in 'myrepo-api'"

# Get PR details and comments
"Get details for pull request #123 in 'myrepo-api'"
"Show me all comments from pull request #123 in 'myrepo-api'"

# Add review comments
"Add comment to pull request #123 in 'myrepo-api': Please add error handling for the API timeout scenario"

# Approve and merge
"Approve pull request #123 in 'myrepo-api'"
"Merge pull request #123 in 'myrepo-api' using squash strategy and close the source branch"
```

### Release Management
```bash
# Check tags for version information
"List all tags in 'myrepo-web' to see the release history"

# Analyze commits between releases
"Get commit history for the 'release/v2.1' branch in 'myrepo-web'"
```

### Deployment Management Workflow
```bash
# Monitor deployments across all environments
"List all deployments for 'myrepo-api'"

# Check production deployments specifically
"List deployments for 'myrepo-api' filtered by 'production' environment"

# Get detailed deployment information
"Get details for deployment '12345678-1234-1234-1234-123456789abc' in 'myrepo-api'"

# Monitor deployment status
"Show me the current deployment status for 'myrepo-api' in production environment"
```

### Repository Cloning Workflow
```bash
# Clone repository using SSH (default and recommended)
"Generate clone command for 'myrepo-api' repository using SSH"

# Clone repository using HTTPS
"Generate clone command for 'myrepo-api' repository using HTTPS protocol"

# Clone specific branch
"Generate clone command for 'myrepo-api' repository from the 'develop' branch using SSH"

# Clone to custom directory
"Generate clone command for 'myrepo-api' repository to directory 'my-local-api-project' using SSH"

# Complete workflow example
"Generate SSH clone command for 'myrepo-web' repository from 'main' branch to 'myrepo-frontend' directory"
```

## Error Handling

The server includes comprehensive error handling for:
- Invalid authentication credentials
- Repository not found
- Branch not found
- Pull request not found
- Insufficient permissions
- API rate limiting
- Network connectivity issues

Errors are returned with descriptive messages to help troubleshoot issues.

## Security

- **API Tokens (Recommended)**: More secure than App Passwords with better access control
- **App Passwords**: Deprecated but still supported for backward compatibility
- **Environment Variables**: Credentials are stored as environment variables, never in code
- **HTTPS**: All API communications use HTTPS encryption
- **No Logging**: No credentials are logged or exposed in responses
- **Least Privilege**: Only request necessary permissions for operations

### API Token vs App Password Security Benefits

| Feature | API Token | App Password |
|---------|-----------|-------------|
| Security | Better access control and monitoring | Legacy security model |
| Granular Permissions | Fine-grained scope control | Basic permission sets |
| Audit Trail | Enhanced logging and tracking | Limited audit capabilities |
| Revocation | Easy token revocation | Manual password management |
| Future Support | Actively maintained | Deprecated, limited updates |

### Migration Guide: App Password to API Token

**Why Migrate?**
- Enhanced security with better access control
- Improved audit trail and monitoring
- Future-proof authentication method
- Better integration with modern DevOps practices

**Migration Steps:**

1. **Create New API Token:**
   - Go to https://bitbucket.org/account/settings/app-passwords/
   - Click "Create app password"
   - Use descriptive name: "MCP Server API Token"
   - Select required scopes:
     - **Repositories**: Read, Write, Admin
     - **Pull requests**: Read, Write
     - **Account**: Read
   - Copy the generated token

2. **Update Environment Variables:**
   ```bash
   # Remove old App Password
   unset BITBUCKET_APP_PASSWORD
   
   # Set new API Token
   export BITBUCKET_API_TOKEN="your-new-api-token"
   ```

3. **Update MCP Configuration:**
   - Replace `BITBUCKET_APP_PASSWORD` with `BITBUCKET_API_TOKEN` in your MCP config
   - Keep `BITBUCKET_USERNAME` and `BITBUCKET_WORKSPACE` unchanged

4. **Test Connection:**
   - Restart your MCP server
   - Test basic operations like listing repositories
   - Verify all functionality works as expected

5. **Revoke Old App Password:**
   - Once confirmed working, revoke the old App Password
   - Go to https://bitbucket.org/account/settings/app-passwords/
   - Delete the old App Password entry

**Rollback Plan:**
- Keep your old App Password active during migration
- If issues occur, switch back to `BITBUCKET_APP_PASSWORD`
- Contact support if persistent issues with API tokens

## API Rate Limits

Bitbucket API has rate limits. The server will return appropriate error messages if limits are exceeded. Consider implementing exponential backoff for high-frequency operations.

## What's New in Version 0.6.0

### New Features Added:
1. **API Token Support**: Enhanced authentication with API tokens (recommended over App Passwords)
   - Support for both API tokens and App Passwords (backward compatibility)
   - Improved security with better access control
   - Enhanced audit trail and monitoring capabilities
   - Future-proof authentication method

2. **Enhanced Authentication Options**:
   - `BITBUCKET_API_TOKEN` environment variable for API token authentication
   - `BITBUCKET_APP_PASSWORD` still supported for backward compatibility
   - Clear migration guide from App Passwords to API tokens
   - Comprehensive troubleshooting documentation

### Enhanced Capabilities:
- Better security with granular permission control
- Improved credential management and revocation
- Enhanced error handling for authentication issues
- Comprehensive migration documentation and troubleshooting
- Clear comparison between API tokens and App Passwords

### Previous Version Highlights:

#### Version 0.5.0:
1. **Repository Cloning**: SSH and HTTPS repository cloning support
   - `clone_repository` - Generate git clone commands with SSH (default) or HTTPS protocol
   - Support for specific branch cloning
   - Custom directory naming
   - SSH setup instructions and prerequisites
   - Complete git command generation ready for terminal execution

2. **Enhanced Cloning Capabilities**:
   - SSH protocol as default for secure cloning
   - Flexible protocol selection (SSH/HTTPS)
   - Branch-specific cloning support
   - Comprehensive clone instructions with setup guidance
   - Repository verification before generating clone commands

#### Version 0.4.0:
1. **Deployment Management**: Complete deployment monitoring and management capabilities
   - `list_deployments` - List and filter deployments by environment
   - `get_deployment` - Get detailed deployment information
   - Support for all deployment states (UNDEPLOYED, IN_PROGRESS, SUCCESSFUL, FAILED, STOPPED)
   - Environment-based filtering and monitoring
   - Complete deployment metadata including release and commit information

#### Version 0.3.0:
- Deployment status tracking across multiple environments
- Release and commit information for each deployment
- Deployment history analysis and monitoring
- Environment-specific deployment filtering
- Enhanced pagination support for deployment listings

#### Version 0.2.0:
1. **Repository Tags Support**: Complete tag management with `list_tags`
2. **Branch Commit History**: Detailed commit analysis with `get_branch_commits`
3. **Pull Request Comments**: Full comment retrieval with `get_pull_request_comments`

## Development

### Project Structure
```
bitbucket-mcp-server/
├── src/
│   ├── index.ts                      # Main server orchestrator
│   ├── types.ts                      # TypeScript interfaces and type definitions
│   ├── tools.ts                      # MCP tool schema definitions
│   └── handlers/
│       ├── repository.ts             # Repository operations (list, clone, branches, tags, commits)
│       ├── branch.ts                 # Branch operations (create branch)
│       ├── pullRequest.ts            # Pull request operations (create, list, approve, merge, comments)
│       └── deployment.ts             # Deployment operations (list, get details)
├── build/
│   ├── index.js                      # Compiled main server
│   ├── types.js                      # Compiled type definitions
│   ├── tools.js                      # Compiled tool schemas
│   └── handlers/
│       ├── repository.js             # Compiled repository handlers
│       ├── branch.js                 # Compiled branch handlers
│       ├── pullRequest.js            # Compiled pull request handlers
│       └── deployment.js             # Compiled deployment handlers
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── CHANGELOG.md          # Version history and changes
└── README.md            # This documentation
```

### Building
```bash
npm run build
```

### Running Locally
```bash
# Set environment variables (API Token - Recommended)
export BITBUCKET_USERNAME="your-username"
export BITBUCKET_API_TOKEN="your-api-token"
export BITBUCKET_WORKSPACE="your-workspace"

# Alternative: App Password (Deprecated)
# export BITBUCKET_USERNAME="your-username"
# export BITBUCKET_APP_PASSWORD="your-app-password"
# export BITBUCKET_WORKSPACE="your-workspace"

# Run the server
node build/index.js
```

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - **For API Tokens**: Verify your API token is correct and has required scopes
   - **For App Passwords**: Verify your App Password is correct and has required permissions
   - Ensure your username is correct (use email if that's how you log in)
   - Check that you're using the correct environment variable (`BITBUCKET_API_TOKEN` vs `BITBUCKET_APP_PASSWORD`)
   - Verify the token/password hasn't expired or been revoked

2. **Repository Not Found**
   - Verify the repository name is correct (case-sensitive)
   - Ensure you have access to the repository
   - Check that the workspace name is correct
   - Confirm your API token has repository read permissions

3. **Branch Not Found**
   - Verify the branch name exists in the repository
   - Check for typos in branch names
   - Ensure the branch hasn't been deleted

4. **Server Not Starting**
   - Check that all environment variables are set
   - Verify the build completed successfully
   - Check the Node.js version compatibility
   - Ensure you're using either API token OR App Password, not both

### API Token Specific Troubleshooting

5. **API Token Issues**
   - **Invalid Token**: Verify the token was copied correctly (no extra spaces/characters)
   - **Insufficient Scopes**: Ensure your token has all required permissions:
     - Repositories: Read, Write, Admin
     - Pull requests: Read, Write
     - Account: Read
   - **Token Revoked**: Check if the token was accidentally deleted in Bitbucket settings
   - **Workspace Access**: Verify the token has access to the specified workspace

6. **Migration Issues**
   - **Mixed Credentials**: Don't set both `BITBUCKET_API_TOKEN` and `BITBUCKET_APP_PASSWORD`
   - **Config Mismatch**: Ensure your MCP configuration matches your environment variables
   - **Caching**: Clear any cached credentials or restart your MCP client

### Testing Your Configuration

**Quick Test Commands:**
```bash
# Test API token authentication
curl -u "your-username:your-api-token" \
  "https://api.bitbucket.org/2.0/user"

# Test workspace access
curl -u "your-username:your-api-token" \
  "https://api.bitbucket.org/2.0/workspaces/your-workspace"
```

**Expected Response:**
- Status 200 with user/workspace information
- Status 401 indicates authentication failure
- Status 403 indicates insufficient permissions

### Debug Mode
To enable detailed logging, you can modify the server code to include debug statements or check the MCP client logs for detailed error information.

## Contributing

This MCP server provides comprehensive Bitbucket integration. To extend functionality:

1. Add new tool definitions in the `setupToolHandlers()` method
2. Implement the corresponding handler methods  
3. Update this documentation
4. Test thoroughly with your Bitbucket repositories

## License

This project is part of the MCP ecosystem and follows standard open-source practices.

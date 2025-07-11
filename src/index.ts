#!/usr/bin/env node

/**
 * Bitbucket MCP Server
 * 
 * This MCP server provides tools for interacting with Bitbucket repositories:
 * - Creating branches
 * - Creating and managing pull requests
 * - Reviewing pull requests
 * - Managing repositories
 * - Repository cloning with SSH/HTTPS support
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import axios, { AxiosInstance, AxiosError } from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';

import { TOOL_SCHEMAS } from './tools.js';
import { RepositoryHandlers } from './handlers/repository.js';
import { BranchHandlers } from './handlers/branch.js';
import { PullRequestHandlers } from './handlers/pullRequest.js';
import { DeploymentHandlers } from './handlers/deployment.js';

// Authentication validation and priority logic
function validateAndGetAuthConfig() {
  const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');
  
  let settings: any = {};
  try {
    if (fs.existsSync(settingsPath)) {
      const settingsContent = fs.readFileSync(settingsPath, 'utf8');
      settings = JSON.parse(settingsContent);
    }
  } catch (error) {
    console.error('[Auth] Warning: Could not read ~/.claude/settings.json:', error);
  }

  // Extract Bitbucket credentials from MCP server settings
  const serverConfig = settings.mcpServers?.['bitbucket-mcp-server'] || {};
  const envConfig = serverConfig.env || {};
  const BITBUCKET_USERNAME = envConfig.BITBUCKET_USERNAME || process.env.BITBUCKET_USERNAME;
  const BITBUCKET_APP_PASSWORD = envConfig.BITBUCKET_APP_PASSWORD || process.env.BITBUCKET_APP_PASSWORD;
  const BITBUCKET_API_TOKEN = envConfig.BITBUCKET_API_TOKEN || process.env.BITBUCKET_API_TOKEN;
  const BITBUCKET_WORKSPACE = envConfig.BITBUCKET_WORKSPACE || process.env.BITBUCKET_WORKSPACE;

  if (!BITBUCKET_USERNAME) {
    throw new Error('BITBUCKET_USERNAME is required. Set it in ~/.claude/settings.json under mcpServers.bitbucket-mcp-server.env.BITBUCKET_USERNAME or as environment variable');
  }

  if (!BITBUCKET_WORKSPACE) {
    throw new Error('BITBUCKET_WORKSPACE is required. Set it in ~/.claude/settings.json under mcpServers.bitbucket-mcp-server.env.BITBUCKET_WORKSPACE or as environment variable');
  }

  // Priority: API Token > App Password
  if (BITBUCKET_API_TOKEN) {
    console.error('[Auth] Using Bitbucket API Token authentication');
    return {
      username: BITBUCKET_USERNAME,
      password: BITBUCKET_API_TOKEN,
      workspace: BITBUCKET_WORKSPACE,
      authMethod: 'API Token'
    };
  } else if (BITBUCKET_APP_PASSWORD) {
    console.error('[Auth] Using Bitbucket App Password authentication');
    return {
      username: BITBUCKET_USERNAME,
      password: BITBUCKET_APP_PASSWORD,
      workspace: BITBUCKET_WORKSPACE,
      authMethod: 'App Password'
    };
  } else {
    throw new Error(
      'Authentication required: Please provide either BITBUCKET_API_TOKEN or BITBUCKET_APP_PASSWORD in ~/.claude/settings.json under MCP server configuration.\n' +
      'Example settings.json:\n' +
      '{\n' +
      '  "mcpServers": {\n' +
      '    "bitbucket-mcp-server": {\n' +
      '      "env": {\n' +
      '        "BITBUCKET_USERNAME": "your-username",\n' +
      '        "BITBUCKET_WORKSPACE": "your-workspace",\n' +
      '        "BITBUCKET_API_TOKEN": "your-api-token"\n' +
      '      }\n' +
      '    }\n' +
      '  }\n' +
      '}'
    );
  }
}

const authConfig = validateAndGetAuthConfig();

class BitbucketServer {
  private server: Server;
  private axiosInstance: AxiosInstance;
  private authConfig: any;
  
  // Handler instances
  private repositoryHandlers: RepositoryHandlers;
  private branchHandlers: BranchHandlers;
  private pullRequestHandlers: PullRequestHandlers;
  private deploymentHandlers: DeploymentHandlers;

  constructor() {
    this.authConfig = validateAndGetAuthConfig();
    
    this.server = new Server(
      {
        name: "bitbucket-mcp-server",
        version: "0.5.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Create axios instance with Bitbucket API configuration
    this.axiosInstance = axios.create({
      baseURL: 'https://api.bitbucket.org/2.0',
      auth: {
        username: this.authConfig.username,
        password: this.authConfig.password,
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    // Initialize handler instances
    this.repositoryHandlers = new RepositoryHandlers(this.axiosInstance, this.authConfig.workspace);
    this.branchHandlers = new BranchHandlers(this.axiosInstance, this.authConfig.workspace);
    this.pullRequestHandlers = new PullRequestHandlers(this.axiosInstance, this.authConfig.workspace, this.authConfig.username);
    this.deploymentHandlers = new DeploymentHandlers(this.axiosInstance, this.authConfig.workspace);

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    // Register all tool schemas
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: TOOL_SCHEMAS,
    }));

    // Handle tool execution requests
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          // Repository operations
          case 'list_repositories':
            return await this.repositoryHandlers.listRepositories(request.params.arguments);
          
          case 'list_projects':
            return await this.repositoryHandlers.listProjects(request.params.arguments);
          
          case 'list_branches':
            return await this.repositoryHandlers.listBranches(request.params.arguments);
          
          case 'list_tags':
            return await this.repositoryHandlers.listTags(request.params.arguments);
          
          case 'get_branch_commits':
            return await this.repositoryHandlers.getBranchCommits(request.params.arguments);
          
          case 'clone_repository':
            return await this.repositoryHandlers.cloneRepository(request.params.arguments);
          
          // Branch operations
          case 'create_branch':
            return await this.branchHandlers.createBranch(request.params.arguments);
          
          // Pull Request operations
          case 'create_pull_request':
            return await this.pullRequestHandlers.createPullRequest(request.params.arguments);
          
          case 'list_pull_requests':
            return await this.pullRequestHandlers.listPullRequests(request.params.arguments);
          
          case 'get_pull_request':
            return await this.pullRequestHandlers.getPullRequest(request.params.arguments);
          
          case 'approve_pull_request':
            return await this.pullRequestHandlers.approvePullRequest(request.params.arguments);
          
          case 'decline_pull_request':
            return await this.pullRequestHandlers.declinePullRequest(request.params.arguments);
          
          case 'merge_pull_request':
            return await this.pullRequestHandlers.mergePullRequest(request.params.arguments);
          
          case 'get_pull_request_comments':
            return await this.pullRequestHandlers.getPullRequestComments(request.params.arguments);
          
          case 'add_pull_request_comment':
            return await this.pullRequestHandlers.addPullRequestComment(request.params.arguments);
          
          // Deployment operations
          case 'list_deployments':
            return await this.deploymentHandlers.listDeployments(request.params.arguments);
          
          case 'get_deployment':
            return await this.deploymentHandlers.getDeployment(request.params.arguments);
          
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${request.params.name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }

        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError;
          const status = axiosError.response?.status;
          const message = axiosError.response?.data || axiosError.message;
          
          throw new McpError(
            ErrorCode.InternalError,
            `Bitbucket API error (${status}): ${JSON.stringify(message)}`
          );
        }

        throw new McpError(
          ErrorCode.InternalError,
          `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Bitbucket MCP server running on stdio');
  }
}

const server = new BitbucketServer();
server.run().catch(console.error);

/**
 * Repository-related operation handlers.
 *
 * Each public method receives a *validated* Zod input type and returns
 * a `CallToolResult` for the MCP SDK.
 */

import type { AxiosInstance } from 'axios';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { createChildLogger } from '../logger.js';
import { NotFoundError } from '../errors.js';
import type {
  ListRepositoriesInput,
  ListProjectsInput,
  ListBranchesInput,
  ListTagsInput,
  GetBranchCommitsInput,
  CloneRepositoryInput,
} from '../schemas.js';
import type {
  BitbucketRepository,
  BitbucketBranch,
  BitbucketTag,
  BitbucketCommit,
} from '../types.js';

const log = createChildLogger('repository');

export class RepositoryHandlers {
  constructor(
    private readonly axiosInstance: AxiosInstance,
    private readonly workspace: string,
  ) {}

  async listRepositories(args: ListRepositoriesInput): Promise<CallToolResult> {
    const page = args.page ?? 1;
    const pagelen = args.pagelen ?? 10;
    const project = args.project;

    const params: Record<string, unknown> = { page, pagelen };
    if (project) {
      params.q = `project.key="${project}"`;
    }

    log.info({ page, pagelen, project }, 'Listing repositories');

    const response = await this.axiosInstance.get(`/repositories/${this.workspace}`, { params });

    const repositories: BitbucketRepository[] = response.data.values;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              repositories: repositories.map((repo) => ({
                name: repo.name,
                full_name: repo.full_name,
                is_private: repo.is_private,
                description: repo.description || 'No description',
              })),
              filter: { project: project || 'all projects' },
              pagination: {
                page,
                pagelen,
                total: response.data.size ?? repositories.length,
              },
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  async listProjects(args: ListProjectsInput): Promise<CallToolResult> {
    const page = args.page ?? 1;
    const pagelen = args.pagelen ?? 10;

    log.info({ page, pagelen }, 'Listing projects');

    const response = await this.axiosInstance.get(`/workspaces/${this.workspace}/projects`, {
      params: { page, pagelen },
    });

    interface ProjectRecord {
      key: string;
      name: string;
      description?: string;
      is_private: boolean;
      created_on: string;
      updated_on: string;
      owner?: { display_name: string; username: string };
      links?: { html?: { href: string } };
    }

    const projects: ProjectRecord[] = response.data.values ?? [];

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              workspace: this.workspace,
              projects: projects.map((project) => ({
                key: project.key,
                name: project.name,
                description: project.description || 'No description',
                is_private: project.is_private,
                created_on: project.created_on,
                updated_on: project.updated_on,
                owner: project.owner
                  ? {
                      display_name: project.owner.display_name,
                      username: project.owner.username,
                    }
                  : null,
                links: project.links?.html?.href ? { html: project.links.html.href } : null,
              })),
              pagination: {
                page,
                pagelen,
                total: response.data.size ?? projects.length,
              },
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  async listBranches(args: ListBranchesInput): Promise<CallToolResult> {
    const { repository } = args;

    log.info({ repository }, 'Listing branches');

    const response = await this.axiosInstance.get(
      `/repositories/${this.workspace}/${repository}/refs/branches`,
    );

    const branches: BitbucketBranch[] = response.data.values;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              repository,
              branches: branches.map((branch) => ({
                name: branch.name,
                commit_hash: branch.target.hash,
                commit_message: branch.target.message,
              })),
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  async listTags(args: ListTagsInput): Promise<CallToolResult> {
    const { repository, page = 1, pagelen = 10 } = args;

    log.info({ repository, page, pagelen }, 'Listing tags');

    const response = await this.axiosInstance.get(
      `/repositories/${this.workspace}/${repository}/refs/tags`,
      { params: { page, pagelen } },
    );

    const tags: BitbucketTag[] = response.data.values;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              repository,
              tags: tags.map((tag) => ({
                name: tag.name,
                commit_hash: tag.target.hash,
                commit_message: tag.target.message,
                commit_date: tag.target.date,
                tagger: tag.tagger
                  ? {
                      name: tag.tagger.user.display_name,
                      username: tag.tagger.user.username,
                      tagged_on: tag.tagger.date,
                    }
                  : null,
              })),
              pagination: {
                page,
                pagelen,
                total: response.data.size ?? tags.length,
              },
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  async getBranchCommits(args: GetBranchCommitsInput): Promise<CallToolResult> {
    const { repository, branch, page = 1, pagelen = 10 } = args;

    log.info({ repository, branch, page, pagelen }, 'Getting branch commits');

    const response = await this.axiosInstance.get(
      `/repositories/${this.workspace}/${repository}/commits/${branch}`,
      { params: { page, pagelen } },
    );

    const commits: BitbucketCommit[] = response.data.values;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              repository,
              branch,
              commits: commits.map((commit) => ({
                hash: commit.hash,
                message: commit.message,
                date: commit.date,
                author: {
                  raw: commit.author.raw,
                  display_name: commit.author.user?.display_name || 'Unknown',
                  username: commit.author.user?.username || 'unknown',
                },
                parents: commit.parents.map((parent) => parent.hash),
                url: commit.links.html.href,
              })),
              pagination: {
                page,
                pagelen,
                total: response.data.size ?? commits.length,
              },
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  async cloneRepository(args: CloneRepositoryInput): Promise<CallToolResult> {
    const { repository, directory, protocol = 'ssh', branch } = args;

    log.info({ repository, protocol, branch }, 'Preparing clone info');

    const repoResponse = await this.axiosInstance.get(
      `/repositories/${this.workspace}/${repository}`,
    );

    const repoData = repoResponse.data;
    const cloneLinks: Array<{ name: string; href: string }> | undefined = repoData.links?.clone;

    if (!cloneLinks) {
      throw new NotFoundError('Clone links', repository);
    }

    const link = cloneLinks.find((l) => l.name === protocol);
    if (!link) {
      throw new NotFoundError(`${protocol.toUpperCase()} clone URL`, repository);
    }
    const cloneUrl = link.href;

    const targetDirectory = directory || repository;
    let gitCommand = `git clone ${cloneUrl}`;
    if (branch) gitCommand += ` --branch ${branch}`;
    gitCommand += ` ${targetDirectory}`;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              message: 'Repository clone information prepared',
              repository: repoData.name as string,
              full_name: repoData.full_name as string,
              clone_url: cloneUrl,
              protocol,
              target_directory: targetDirectory,
              branch: branch || 'default',
              command: gitCommand,
              instructions: [
                'To clone this repository, run the following command:',
                gitCommand,
                '',
                'Note: For SSH cloning, ensure you have:',
                '1. SSH keys configured in your Bitbucket account',
                '2. SSH agent running with your key loaded',
                '3. Bitbucket.org added to your known_hosts',
              ].join('\n'),
            },
            null,
            2,
          ),
        },
      ],
    };
  }
}

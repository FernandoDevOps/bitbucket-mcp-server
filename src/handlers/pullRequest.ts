/**
 * Pull Request-related operation handlers.
 */

import type { AxiosInstance } from 'axios';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { createChildLogger } from '../logger.js';
import type { BitbucketPullRequest, BitbucketComment } from '../types.js';
import type {
  CreatePullRequestInput,
  ListPullRequestsInput,
  GetPullRequestInput,
  ApprovePullRequestInput,
  DeclinePullRequestInput,
  MergePullRequestInput,
  GetPullRequestCommentsInput,
  AddPullRequestCommentInput,
} from '../schemas.js';

const log = createChildLogger('pullRequest');

export class PullRequestHandlers {
  constructor(
    private readonly axiosInstance: AxiosInstance,
    private readonly workspace: string,
    private readonly username?: string,
  ) {}

  async createPullRequest(args: CreatePullRequestInput): Promise<CallToolResult> {
    const {
      repository,
      title,
      description = '',
      source_branch,
      destination_branch = 'main',
      reviewers = [],
    } = args;

    log.info({ repository, title, source_branch, destination_branch }, 'Creating pull request');

    const response = await this.axiosInstance.post(
      `/repositories/${this.workspace}/${repository}/pullrequests`,
      {
        title,
        description,
        source: { branch: { name: source_branch } },
        destination: { branch: { name: destination_branch } },
        reviewers: reviewers.map((username: string) => ({ username })),
      },
    );

    const pr: BitbucketPullRequest = response.data;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              message: 'Pull request created successfully',
              pull_request: {
                id: pr.id,
                title: pr.title,
                description: pr.description,
                state: pr.state,
                source_branch: pr.source.branch.name,
                destination_branch: pr.destination.branch.name,
                author: pr.author.display_name,
                url: pr.links.html.href,
                created_on: pr.created_on,
              },
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  async listPullRequests(args: ListPullRequestsInput): Promise<CallToolResult> {
    const { repository, state = 'OPEN', page = 1 } = args;

    log.info({ repository, state, page }, 'Listing pull requests');

    const response = await this.axiosInstance.get(
      `/repositories/${this.workspace}/${repository}/pullrequests`,
      { params: { state, page } },
    );

    const pullRequests: BitbucketPullRequest[] = response.data.values;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              repository,
              state,
              pull_requests: pullRequests.map((pr) => ({
                id: pr.id,
                title: pr.title,
                state: pr.state,
                source_branch: pr.source.branch.name,
                destination_branch: pr.destination.branch.name,
                author: pr.author.display_name,
                created_on: pr.created_on,
                updated_on: pr.updated_on,
                url: pr.links.html.href,
              })),
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  async getPullRequest(args: GetPullRequestInput): Promise<CallToolResult> {
    const { repository, pull_request_id } = args;

    log.info({ repository, pull_request_id }, 'Getting pull request details');

    const response = await this.axiosInstance.get(
      `/repositories/${this.workspace}/${repository}/pullrequests/${pull_request_id}`,
    );

    const pr: BitbucketPullRequest = response.data;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              id: pr.id,
              title: pr.title,
              description: pr.description,
              state: pr.state,
              source_branch: pr.source.branch.name,
              destination_branch: pr.destination.branch.name,
              author: {
                display_name: pr.author.display_name,
                username: pr.author.username,
              },
              created_on: pr.created_on,
              updated_on: pr.updated_on,
              url: pr.links.html.href,
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  async approvePullRequest(args: ApprovePullRequestInput): Promise<CallToolResult> {
    const { repository, pull_request_id } = args;

    log.info({ repository, pull_request_id }, 'Approving pull request');

    await this.axiosInstance.post(
      `/repositories/${this.workspace}/${repository}/pullrequests/${pull_request_id}/approve`,
      {},
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              message: `Pull request #${pull_request_id} approved successfully`,
              repository,
              pull_request_id,
              approved_by: this.username,
              approval_date: new Date().toISOString(),
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  async declinePullRequest(args: DeclinePullRequestInput): Promise<CallToolResult> {
    const { repository, pull_request_id, reason } = args;

    log.info({ repository, pull_request_id }, 'Declining pull request');

    await this.axiosInstance.post(
      `/repositories/${this.workspace}/${repository}/pullrequests/${pull_request_id}/decline`,
      reason ? { reason } : {},
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              message: `Pull request #${pull_request_id} declined successfully`,
              repository,
              pull_request_id,
              reason: reason || 'No reason provided',
              declined_by: this.username,
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  async mergePullRequest(args: MergePullRequestInput): Promise<CallToolResult> {
    const {
      repository,
      pull_request_id,
      merge_strategy = 'merge_commit',
      close_source_branch = false,
    } = args;

    log.info({ repository, pull_request_id, merge_strategy }, 'Merging pull request');

    const response = await this.axiosInstance.post(
      `/repositories/${this.workspace}/${repository}/pullrequests/${pull_request_id}/merge`,
      { type: merge_strategy, close_source_branch },
    );

    const mergedPR: BitbucketPullRequest = response.data;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              message: `Pull request #${pull_request_id} merged successfully`,
              repository,
              pull_request: {
                id: mergedPR.id,
                title: mergedPR.title,
                state: mergedPR.state,
                merge_strategy,
                close_source_branch,
              },
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  async getPullRequestComments(args: GetPullRequestCommentsInput): Promise<CallToolResult> {
    const { repository, pull_request_id, page = 1, pagelen = 20 } = args;

    log.info({ repository, pull_request_id, page }, 'Getting pull request comments');

    const response = await this.axiosInstance.get(
      `/repositories/${this.workspace}/${repository}/pullrequests/${pull_request_id}/comments`,
      { params: { page, pagelen } },
    );

    const comments: BitbucketComment[] = response.data.values;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              repository,
              pull_request_id,
              comments: comments.map((comment) => ({
                id: comment.id,
                content: {
                  raw: comment.content.raw,
                  html: comment.content.html,
                },
                author: {
                  display_name: comment.user.display_name,
                  username: comment.user.username,
                },
                created_on: comment.created_on,
                updated_on: comment.updated_on,
                url: comment.links.html.href,
                inline: comment.inline
                  ? {
                      path: comment.inline.path,
                      from_line: comment.inline.from,
                      to_line: comment.inline.to,
                    }
                  : null,
              })),
              pagination: {
                page,
                pagelen,
                total: response.data.size ?? comments.length,
              },
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  async addPullRequestComment(args: AddPullRequestCommentInput): Promise<CallToolResult> {
    const { repository, pull_request_id, content } = args;

    log.info({ repository, pull_request_id }, 'Adding pull request comment');

    const response = await this.axiosInstance.post(
      `/repositories/${this.workspace}/${repository}/pullrequests/${pull_request_id}/comments`,
      { content: { raw: content } },
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              message: 'Comment added successfully',
              repository,
              pull_request_id,
              comment: {
                id: response.data.id as number,
                content: response.data.content.raw as string,
                author: response.data.user.display_name as string,
                created_on: response.data.created_on as string,
              },
            },
            null,
            2,
          ),
        },
      ],
    };
  }
}

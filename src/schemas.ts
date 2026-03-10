/**
 * Zod schemas for every tool's input parameters.
 *
 * Each schema is used in two places:
 *  1. Registered with McpServer.tool() so the MCP host sees the JSON-Schema.
 *  2. Parsed at runtime in the handler to get a fully-typed, validated object.
 */

import { z } from 'zod';

// ── Shared field helpers ─────────────────────────────────────────────────────

const repository = z.string().describe('Repository slug (e.g. "my-repo")');
const page = z.number().int().min(1).default(1).describe('Page number for pagination');
const pagelen = (def: number) =>
  z.number().int().min(1).max(100).default(def).describe('Items per page (max 100)');

// ── Repository schemas ───────────────────────────────────────────────────────

export const ListRepositoriesSchema = z.object({
  page: page.optional(),
  pagelen: pagelen(10).optional(),
  project: z.string().optional().describe('Filter by project key'),
});
export type ListRepositoriesInput = z.infer<typeof ListRepositoriesSchema>;

export const ListProjectsSchema = z.object({
  page: page.optional(),
  pagelen: pagelen(10).optional(),
});
export type ListProjectsInput = z.infer<typeof ListProjectsSchema>;

export const ListBranchesSchema = z.object({
  repository,
});
export type ListBranchesInput = z.infer<typeof ListBranchesSchema>;

export const ListTagsSchema = z.object({
  repository,
  page: page.optional(),
  pagelen: pagelen(10).optional(),
});
export type ListTagsInput = z.infer<typeof ListTagsSchema>;

export const GetBranchCommitsSchema = z.object({
  repository,
  branch: z.string().describe('Branch name (e.g. "main")'),
  page: page.optional(),
  pagelen: pagelen(10).optional(),
});
export type GetBranchCommitsInput = z.infer<typeof GetBranchCommitsSchema>;

export const CloneRepositorySchema = z.object({
  repository,
  directory: z.string().optional().describe('Local directory to clone into'),
  protocol: z.enum(['ssh', 'https']).default('ssh').describe('Clone protocol'),
  branch: z.string().optional().describe('Specific branch to clone'),
});
export type CloneRepositoryInput = z.infer<typeof CloneRepositorySchema>;

// ── Branch schemas ───────────────────────────────────────────────────────────

export const CreateBranchSchema = z.object({
  repository,
  branch_name: z.string().describe('Name of the new branch'),
  source_branch: z.string().default('main').describe('Branch to create from'),
});
export type CreateBranchInput = z.infer<typeof CreateBranchSchema>;

// ── Pull Request schemas ─────────────────────────────────────────────────────

export const CreatePullRequestSchema = z.object({
  repository,
  title: z.string().describe('Pull request title'),
  description: z.string().optional().default('').describe('Pull request description'),
  source_branch: z.string().describe('Source branch'),
  destination_branch: z.string().default('main').describe('Destination branch'),
  reviewers: z.array(z.string()).optional().default([]).describe('Reviewer usernames'),
});
export type CreatePullRequestInput = z.infer<typeof CreatePullRequestSchema>;

export const ListPullRequestsSchema = z.object({
  repository,
  state: z.enum(['OPEN', 'MERGED', 'DECLINED']).default('OPEN').describe('PR state filter'),
  page: page.optional(),
});
export type ListPullRequestsInput = z.infer<typeof ListPullRequestsSchema>;

export const GetPullRequestSchema = z.object({
  repository,
  pull_request_id: z.number().int().describe('Pull request ID'),
});
export type GetPullRequestInput = z.infer<typeof GetPullRequestSchema>;

export const ApprovePullRequestSchema = z.object({
  repository,
  pull_request_id: z.number().int().describe('Pull request ID'),
});
export type ApprovePullRequestInput = z.infer<typeof ApprovePullRequestSchema>;

export const DeclinePullRequestSchema = z.object({
  repository,
  pull_request_id: z.number().int().describe('Pull request ID'),
  reason: z.string().optional().describe('Reason for declining'),
});
export type DeclinePullRequestInput = z.infer<typeof DeclinePullRequestSchema>;

export const MergePullRequestSchema = z.object({
  repository,
  pull_request_id: z.number().int().describe('Pull request ID'),
  merge_strategy: z
    .enum(['merge_commit', 'squash', 'fast_forward'])
    .default('merge_commit')
    .describe('Merge strategy'),
  close_source_branch: z.boolean().default(false).describe('Close source branch after merge'),
});
export type MergePullRequestInput = z.infer<typeof MergePullRequestSchema>;

export const GetPullRequestCommentsSchema = z.object({
  repository,
  pull_request_id: z.number().int().describe('Pull request ID'),
  page: page.optional(),
  pagelen: pagelen(20).optional(),
});
export type GetPullRequestCommentsInput = z.infer<typeof GetPullRequestCommentsSchema>;

export const AddPullRequestCommentSchema = z.object({
  repository,
  pull_request_id: z.number().int().describe('Pull request ID'),
  content: z.string().describe('Comment body (Markdown)'),
});
export type AddPullRequestCommentInput = z.infer<typeof AddPullRequestCommentSchema>;

// ── Deployment schemas ───────────────────────────────────────────────────────

export const ListDeploymentsSchema = z.object({
  repository,
  environment: z.string().optional().describe('Filter by environment name'),
  page: page.optional(),
  pagelen: pagelen(10).optional(),
});
export type ListDeploymentsInput = z.infer<typeof ListDeploymentsSchema>;

export const GetDeploymentSchema = z.object({
  repository,
  deployment_uuid: z.string().describe('Deployment UUID'),
});
export type GetDeploymentInput = z.infer<typeof GetDeploymentSchema>;

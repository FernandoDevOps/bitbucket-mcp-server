/**
 * Unit tests for Zod input schemas.
 */

import { describe, it, expect } from 'vitest';
import {
  ListRepositoriesSchema,
  CreateBranchSchema,
  CreatePullRequestSchema,
  MergePullRequestSchema,
  GetPullRequestSchema,
  ListDeploymentsSchema,
} from './schemas.js';

describe('schemas', () => {
  describe('ListRepositoriesSchema', () => {
    it('accepts empty object (all optional)', () => {
      const result = ListRepositoriesSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('rejects page < 1', () => {
      const result = ListRepositoriesSchema.safeParse({ page: 0 });
      expect(result.success).toBe(false);
    });

    it('applies default pagelen', () => {
      const result = ListRepositoriesSchema.parse({});
      expect(result.pagelen).toBe(10); // default from schema
    });
  });

  describe('CreateBranchSchema', () => {
    it('requires repository and branch_name', () => {
      expect(CreateBranchSchema.safeParse({}).success).toBe(false);
      expect(CreateBranchSchema.safeParse({ repository: 'r' }).success).toBe(false);
      expect(CreateBranchSchema.parse({ repository: 'r', branch_name: 'feature/x' })).toMatchObject(
        { repository: 'r', branch_name: 'feature/x', source_branch: 'main' },
      );
    });
  });

  describe('CreatePullRequestSchema', () => {
    it('requires repository, title, source_branch', () => {
      const result = CreatePullRequestSchema.safeParse({
        repository: 'r',
        title: 'My PR',
        source_branch: 'feat/a',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.destination_branch).toBe('main');
        expect(result.data.reviewers).toEqual([]);
      }
    });
  });

  describe('MergePullRequestSchema', () => {
    it('defaults merge_strategy and close_source_branch', () => {
      const result = MergePullRequestSchema.parse({ repository: 'r', pull_request_id: 1 });
      expect(result.merge_strategy).toBe('merge_commit');
      expect(result.close_source_branch).toBe(false);
    });
  });

  describe('GetPullRequestSchema', () => {
    it('rejects non-integer pull_request_id', () => {
      const result = GetPullRequestSchema.safeParse({ repository: 'r', pull_request_id: 1.5 });
      expect(result.success).toBe(false);
    });
  });

  describe('ListDeploymentsSchema', () => {
    it('accepts repository alone', () => {
      const result = ListDeploymentsSchema.safeParse({ repository: 'r' });
      expect(result.success).toBe(true);
    });
  });
});

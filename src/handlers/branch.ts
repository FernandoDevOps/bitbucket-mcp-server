/**
 * Branch-related operation handlers.
 */

import type { AxiosInstance } from 'axios';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { createChildLogger } from '../logger.js';
import type { CreateBranchInput } from '../schemas.js';

const log = createChildLogger('branch');

export class BranchHandlers {
  constructor(
    private readonly axiosInstance: AxiosInstance,
    private readonly workspace: string,
  ) {}

  async createBranch(args: CreateBranchInput): Promise<CallToolResult> {
    const { repository, branch_name, source_branch = 'main' } = args;

    log.info({ repository, branch_name, source_branch }, 'Creating branch');

    // Resolve the source commit hash
    const sourceBranchResponse = await this.axiosInstance.get(
      `/repositories/${this.workspace}/${repository}/refs/branches/${source_branch}`,
    );

    const targetHash: string = sourceBranchResponse.data.target.hash;

    const response = await this.axiosInstance.post(
      `/repositories/${this.workspace}/${repository}/refs/branches`,
      { name: branch_name, target: { hash: targetHash } },
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              message: `Branch '${branch_name}' created successfully`,
              repository,
              branch: {
                name: response.data.name as string,
                source_branch,
                commit_hash: response.data.target.hash as string,
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

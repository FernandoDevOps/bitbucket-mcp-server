/**
 * Deployment-related operation handlers.
 */

import type { AxiosInstance } from 'axios';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { createChildLogger } from '../logger.js';
import type { BitbucketDeployment } from '../types.js';
import type { ListDeploymentsInput, GetDeploymentInput } from '../schemas.js';

const log = createChildLogger('deployment');

/** Shape of an environment record returned by the Bitbucket API. */
interface BitbucketEnvironment {
  uuid: string;
  name: string;
}

export class DeploymentHandlers {
  constructor(
    private readonly axiosInstance: AxiosInstance,
    private readonly workspace: string,
  ) {}

  async listDeployments(args: ListDeploymentsInput): Promise<CallToolResult> {
    const { repository, environment, page = 1, pagelen = 10 } = args;

    log.info({ repository, environment, page, pagelen }, 'Listing deployments');

    try {
      // Map environment UUIDs → names
      const envsResponse = await this.axiosInstance.get(
        `/repositories/${this.workspace}/${repository}/environments`,
      );
      const environmentsMap = new Map<string, string>();
      (envsResponse.data.values as BitbucketEnvironment[] | undefined)?.forEach((env) => {
        environmentsMap.set(env.uuid, env.name);
      });

      // Fetch extra data so we can sort by date and still honour pagelen
      const fetchSize = Math.max(pagelen * 50, 500);
      const response = await this.axiosInstance.get(
        `/repositories/${this.workspace}/${repository}/deployments`,
        { params: { page: 1, pagelen: fetchSize } },
      );

      let deployments: BitbucketDeployment[] = response.data.values ?? [];

      // Sort newest-first
      deployments.sort(
        (a, b) => new Date(b.created_on).getTime() - new Date(a.created_on).getTime(),
      );

      // Filter by environment if requested
      if (environment) {
        const targetEnvUuid = (
          envsResponse.data.values as BitbucketEnvironment[] | undefined
        )?.find((env) => env.name === environment)?.uuid;
        deployments = deployments.filter((dep) => dep.environment?.uuid === targetEnvUuid);
      }

      deployments = deployments.slice(0, pagelen);

      const transformedDeployments = deployments.map((deployment) => ({
        uuid: deployment.uuid,
        number: deployment.number,
        created_on: deployment.created_on,
        state: {
          type: deployment.state.type,
          name: deployment.state.name,
          trigger_url: deployment.state.trigger_url || deployment.state.triggerUrl,
        },
        environment: {
          uuid: deployment.environment.uuid,
          name: environmentsMap.get(deployment.environment.uuid) || 'Unknown',
        },
        deployable: {
          name: deployment.deployable.name,
          url: deployment.deployable.url,
          pipeline_uuid: deployment.deployable.pipeline.uuid,
          commit_hash: deployment.deployable.commit.hash,
          commit_url: deployment.deployable.commit.links.html.href,
          created_on: deployment.deployable.created_on,
        },
        release: {
          name: deployment.release.name,
          url: deployment.release.url,
          pipeline_uuid: deployment.release.pipeline.uuid,
          commit_hash: deployment.release.commit.hash,
          commit_url: deployment.release.commit.links.html.href,
          created_on: deployment.release.created_on,
        },
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                repository,
                environment: environment || 'all',
                deployments: transformedDeployments,
                pagination: {
                  page,
                  pagelen: transformedDeployments.length,
                  total: response.data.size as number,
                  has_next: !!response.data.next,
                  has_previous: !!response.data.previous,
                },
                environments_available: Array.from(environmentsMap.values()),
                note: "Deployments are sorted by creation date (newest first). Use 'environment' parameter to filter by specific environment.",
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error) {
      log.error({ err: error, repository, environment }, 'Failed to retrieve deployments');
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: 'Failed to retrieve deployments',
                repository,
                environment: environment || 'all',
                details: error instanceof Error ? error.message : String(error),
              },
              null,
              2,
            ),
          },
        ],
      };
    }
  }

  async getDeployment(args: GetDeploymentInput): Promise<CallToolResult> {
    const { repository, deployment_uuid } = args;

    log.info({ repository, deployment_uuid }, 'Getting deployment details');

    const response = await this.axiosInstance.get(
      `/repositories/${this.workspace}/${repository}/deployments/${deployment_uuid}`,
    );

    const dep: BitbucketDeployment = response.data;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              uuid: dep.uuid,
              number: dep.number,
              key: dep.key,
              type: dep.type,
              version: dep.version,
              created_on: dep.created_on,
              state: {
                type: dep.state.type,
                name: dep.state.name,
                trigger_url: dep.state.trigger_url || dep.state.triggerUrl,
              },
              environment: { uuid: dep.environment.uuid },
              step: dep.step ? { uuid: dep.step.uuid } : null,
              deployable: {
                type: dep.deployable.type,
                uuid: dep.deployable.uuid,
                key: dep.deployable.key,
                name: dep.deployable.name,
                url: dep.deployable.url,
                pipeline: {
                  uuid: dep.deployable.pipeline.uuid,
                  type: dep.deployable.pipeline.type,
                },
                commit: {
                  hash: dep.deployable.commit.hash,
                  html_url: dep.deployable.commit.links.html.href,
                  type: dep.deployable.commit.type,
                },
                created_on: dep.deployable.created_on,
              },
              release: {
                type: dep.release.type,
                uuid: dep.release.uuid,
                key: dep.release.key,
                name: dep.release.name,
                url: dep.release.url,
                pipeline: {
                  uuid: dep.release.pipeline.uuid,
                  type: dep.release.pipeline.type,
                },
                commit: {
                  hash: dep.release.commit.hash,
                  html_url: dep.release.commit.links.html.href,
                  type: dep.release.commit.type,
                },
                created_on: dep.release.created_on,
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

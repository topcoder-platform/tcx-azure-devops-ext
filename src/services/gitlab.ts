import { Gitlab } from '@gitbeaker/browser';
import get from 'lodash/get';

import { ProjectSchema } from '@gitbeaker/core/dist/types/services/Projects';
import { poll } from '../utils/token-poll';

// Export types
export type IGitlabRepo = ProjectSchema;
export type IGitlabBranch = {
  name: string;
  commit: {
    id: string;
    short_id: string;
    created_at: Date;
    parent_ids?: any;
    title: string;
    message: string;
    author_name: string;
    author_email: string;
    authored_date: Date;
    committer_name: string;
    committer_email: string;
    committed_date: Date;
    web_url: string;
  };
  merged: boolean;
  protected: boolean;
  developers_can_push: boolean;
  developers_can_merge: boolean;
  can_push: boolean;
  default: boolean;
  web_url: string;
};

const concludedPipelineStatuses = [
  'success',
  'failed',
  'canceled',
  'skipped',
  'manual',
  'scheduled'
];

// Gitlab REST client
let _gitlab = new Gitlab();

export function getGitlabInstance() {
  return _gitlab;
}

export function initializeGitlabInstance(authToken: string) {
  if (authToken) {
    _gitlab = new Gitlab({ token: authToken });
  } else {
    _gitlab = new Gitlab();
  }
  return _gitlab;
}

/**
 * Creates or updates a secret for a Gitlab repository.
 * The secret can be used in a Gitlab CI/CD Pipeline.
 * @param gitlabRepository Gitlab Repository
 * @param secretName Name of the secret
 * @param secretValue Value of the secret
 */
export async function createOrUpdateGitlabRepoSecret(
  gitlabRepository: IGitlabRepo,
  secretName: string,
  secretValue: string
) {
  // Get the Gitlab instance
  const client = getGitlabInstance();
  // Fetch the project ID.
  const projectId = get(gitlabRepository, 'id');
  // Create or update the secret
  try {
    const res = await client.ProjectVariables.edit(projectId!, secretName, {
      value: secretValue,
      masked: true,
      protected: false
    });
    return res;
  } catch (e) {
    const res = await client.ProjectVariables.create(projectId!, {
      key: secretName,
      value: secretValue,
      masked: true,
      protected: false
    });
    return res;
  }
}

/**
 * Creates or updates a file in a particular Gitlab repo and branch.
 * File is created/updated as a commit.
 * @param gitlabRepository Gitlab repository
 * @param gitlabBranch Gitlab branch
 * @param filePath File Path
 * @param fileContents File Contents
 * @param commitMessage Commit Message
 */
export async function createOrUpdateGitlabFile(
  gitlabRepository: IGitlabRepo,
  gitlabBranch: IGitlabBranch,
  filePath: string,
  fileContents: string,
  commitMessage: string
) {
  // Get the Gitlab instance
  const client = getGitlabInstance();
  // Fetch the project ID.
  const projectId = get(gitlabRepository, 'id');
  try {
    // Try to update the file
    const res = await client.RepositoryFiles.edit(
      projectId,
      filePath,
      gitlabBranch.name,
      fileContents,
      commitMessage
    );
    return res;
  } catch (_err) {
    const res = await client.RepositoryFiles.create(
      projectId,
      filePath,
      gitlabBranch.name,
      fileContents,
      commitMessage
    );
    return res;
  }
}

/**
 * Wait for the latest CI Pipeline run to conclude.
 * @param gitlabRepository Gitlab Repository
 * @param intervalInS Interval in seconds (for polling of status)
 * @param timeoutInS Timeout in seconds (for polling of status)
 */
export async function waitForGitlabPipeline(
  gitlabRepository: IGitlabRepo,
  intervalInS: number,
  timeoutInS: number
) {
  // Get the Gitlab instance
  const client = getGitlabInstance();
  // Fetch the project ID.
  const projectId = get(gitlabRepository, 'id');
  // Declare failure flag
  let abortPipelineFailed = false;
  let pipelineId: number;
  // Poll for the status of pipeline run
  const pollingFn = async () => {
    let pipeline;
    if (!pipelineId) {
      // Get all pipelines (when the pipeline ID is not known).
      // Pipeline are filtered by pipeline ID or manifest path.
      const pipelines = await client.Pipelines.all(projectId);
      // Store the pipeline (for checking) and the pipeline ID (for checking the next time).
      pipeline = get(pipelines, '[0]');
      pipelineId = get(pipelines, '[0].id');
    } else {
      // Pipeline ID is available. Query for the specific pipeline.
      pipeline = await client.Pipelines.show(projectId, pipelineId);
    }
    // Check the pipeline's status.
    if (pipeline && concludedPipelineStatuses.includes(pipeline.status)) {
      if (pipeline.status !== 'success') {
        abortPipelineFailed = true;
      }
      return true;
    }
    // Pipeline hasn't completed yet. Throw an error.
    throw new Error('Waiting for pipeline to conclude.');
  };
  const success = await poll(pollingFn, intervalInS, timeoutInS);
  // Check if pipeline completed successfully.
  if (abortPipelineFailed) {
    throw new Error('Pipeline did not complete successfully.');
  }
  // Pipeline did complete successfully.
  return success;
}

import axios from 'axios';
import { Octokit } from '@octokit/rest';
import tweetsodium from 'tweetsodium';
import { bytesToBase64 } from 'byte-base64';

import isString from 'lodash/isString';
import map from 'lodash/map';
import get from 'lodash/get';
import isNil from 'lodash/isNil';

import { IterableElement } from 'type-fest';
import {
  ReposGetResponseData,
  ReposListBranchesResponseData
} from '@octokit/types';

import { GITHUB_CONFIG } from '../config';
import { poll } from '../utils/token-poll';

// Github Auth Initialization Response
export interface IGithubAuthInitResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

// Github Auth Token Response
export interface IGithubAuthTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

// Github REST client
let _octokit = new Octokit();

export function getOctokitInstance() {
  return _octokit;
}

export function initializeOctokitInstance(authToken: string) {
  if (authToken) {
    _octokit = new Octokit({ auth: authToken });
  } else {
    _octokit = new Octokit();
  }
  return _octokit;
}

/**
 * Starts the Github auth flow
 */
export async function initiateAuthorizationFlow() {
  const postBody = {
    client_id: GITHUB_CONFIG.CLIENT_ID,
    scope: GITHUB_CONFIG.SCOPE
  };
  const headers = {
    'Accept': 'application/json'
  };
  return axios.post<IGithubAuthInitResponse>(
    GITHUB_CONFIG.AUTH_INIT_URL,
    postBody,
    { headers }
  ).then(res => res.data);
}

/**
 * Checks if the OAuth request has been granted
 * @param authInitResponse The response from the authentication initialization request
 */
export async function checkAuthorizationStatus(authInitResponse: IGithubAuthInitResponse) {
  const postBody = {
    client_id: GITHUB_CONFIG.CLIENT_ID,
    device_code: authInitResponse.device_code,
    grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
  };
  const headers = {
    'Accept': 'application/json'
  };
  const res = await axios.post<IGithubAuthTokenResponse>(
    GITHUB_CONFIG.AUTH_TOKEN_URL,
    postBody,
    { headers }
  );
  const error = get(res, 'data.error');
  if (error) {
    throw new Error(error);
  }
  return res;
}

/**
 * Creates or updates a secret for a GitHub repository.
 * The secret can be used in a GitHub actions workflow.
 * @param githubRepository Github Repository
 * @param secretName Name of the secret
 * @param secretValue Value of the secret
 */
export async function createOrUpdateGithubRepoSecret(
  githubRepository: ReposGetResponseData,
  secretName: string,
  secretValue: string
) {
  // Get the octokit instance
  const octokit = getOctokitInstance();
  // Fetch the repo's name and owner.
  const owner = get(githubRepository, 'owner.login');
  const repo = get(githubRepository, 'name');
  // Get repo public key to create secret
  const repoPublicKeyRes = await octokit.actions.getRepoPublicKey({ owner, repo });
  const repoPublicKeyBase64 = get(repoPublicKeyRes, 'data.key');
  if (!repoPublicKeyBase64 || !isString(repoPublicKeyBase64) || repoPublicKeyBase64.length < 10) {
    throw new Error('Invalid Repo Public Key');
  }
  // Encrypt the PAT token using the public key
  const repoPublicKeyRaw = atob(repoPublicKeyBase64);
  const publicKey = Uint8Array.from(map(repoPublicKeyRaw, x => x.charCodeAt(0)));
  const encoder = new TextEncoder();
  const secretValueRaw = tweetsodium.seal(
    encoder.encode(secretValue),
    publicKey
  );
  const secretValueEncryptedBase64 = bytesToBase64(secretValueRaw);
  // Upsert the token as a secret
  return octokit.actions.createOrUpdateRepoSecret({
    owner,
    repo,
    secret_name: secretName,
    encrypted_value: secretValueEncryptedBase64,
    key_id: get(repoPublicKeyRes, 'data.key_id')
  });
}

/**
 * Creates or updates a file in a particular GitHub repo and branch.
 * File is created/updated as a commit.
 * @param githubRepository GitHub repository
 * @param githubBranch GitHub branch
 * @param filePath File Path
 * @param fileContents File Contents
 * @param commitMessage Commit Message
 */
export async function createOrUpdateGitHubFile(
  filePath: string,
  fileContents: string,
  githubRepository: ReposGetResponseData,
  githubBranch: IterableElement<ReposListBranchesResponseData>,
  commitMessage: string
) {
  // Get the octokit instance
  const octokit = getOctokitInstance();
  // Fetch the repo's name and owner.
  const owner = get(githubRepository, 'owner.login');
  const repo = get(githubRepository, 'name');
  let sha: string | undefined;
  try {
    // Get existing file SHA (needed to update it)
    const fileInfoRes = await octokit.repos.getContent({
      owner,
      repo,
      path: filePath,
      ref: `refs/heads/${githubBranch.name}`
    });
    sha = get(fileInfoRes, 'data.sha');
  } catch (_err) {}
  // Commit the manifest
  await octokit.repos.createOrUpdateFileContents({
    content: btoa(fileContents),
    message: commitMessage,
    path: filePath,
    owner,
    repo,
    branch: `refs/heads/${githubBranch.name}`,
    sha
  });
}

/**
 * Wait for the latest Workflow run to conclude.
 * The workflow ID is used to filter the Workflow runs
 * @param githubRepository GitHub Repository
 * @param workflowIdOrManifestPath Workflow ID (manifest path is also acceptable)
 * @param intervalInS Interval in seconds (for polling of status)
 * @param timeoutInS Timeout in seconds (for polling of status)
 */
export async function waitForGithubWorkflow(
  githubRepository: ReposGetResponseData,
  workflowIdOrManifestPath: string | number,
  intervalInS: number,
  timeoutInS: number
) {
  // Get the octokit instance
  const octokit = getOctokitInstance();
  // Fetch the repo's name and owner.
  const owner = get(githubRepository, 'owner.login');
  const repo = get(githubRepository, 'name');
  // Declare failure flag
  let abortWorkFlowFailed = false;
  let workFlowRunId: number;
  // Poll for the status of workflow run
  const pollingFn = async () => {
    let workFlowRun;
    if (!workFlowRunId) {
      // Get all workflow runs (when the workflow ID is not known).
      // Workflow runs are filtered by workflow ID or manifest path.
      const workFlowRunRes = await octokit.actions.listWorkflowRuns({
        owner,
        repo,
        workflow_id: workflowIdOrManifestPath as any,
        page: 1,
        per_page: 1
      });
      // Store the run (for checking) and the run ID (for checking the next time).
      workFlowRun = get(workFlowRunRes, 'data.workflow_runs[0]');
      workFlowRunId = get(workFlowRunRes, 'data.workflow_runs[0].id');
    } else {
      // Workflow Run ID is available. Query for the specific run.
      const workFlowRunRes = await octokit.actions.getWorkflowRun({
        owner,
        repo,
        run_id: workFlowRunId
      });
      // Store the run (for checking).
      workFlowRun = get(workFlowRunRes, 'data');
    }
    // Check the run's status.
    if (workFlowRun && !isNil(workFlowRun.conclusion)) {
      if (workFlowRun.conclusion !== 'success') {
        abortWorkFlowFailed = true;
      }
      return true;
    }
    // Workflow hasn't completed yet. Throw an error.
    throw new Error('Waiting for workflow to conclude.');
  };
  const success = await poll(pollingFn, intervalInS, timeoutInS);
  // Check if workflow completed successfully.
  if (abortWorkFlowFailed) {
    throw new Error('Workflow did not complete successfully.');
  }
  // Workflow did complete successfully.
  return success;
}

import axios from 'axios';
import get from 'lodash/get';
import { GITHUB_CONFIG } from '../config';

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

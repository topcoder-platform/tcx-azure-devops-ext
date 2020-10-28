import axios from 'axios';
import get from 'lodash/get';

import { getRefreshedDeviceToken } from './account';

/**
 * Create an axios instance that can make authenticated requests
 */

/**
 * Attempts to retrieve the access token.
 * If the token has expired, attempts to refresh it.
 * If the token doesn't exist, throws an error.
 */
export async function getToken() {
    const dataService = await VSS.getService(VSS.ServiceIds.ExtensionData);
    let accessToken;
    try {
      accessToken = await dataService.getValue('access-token', {scopeType: 'User'});
      if (!accessToken) {
        throw new Error('No token saved.');
      }
      if (!(isTokenExpired(accessToken))) {
        return accessToken;
      } else {
        return refreshToken();
      }
    } catch (err) {
      console.error(err);
      try {
        return refreshToken();
      } catch (err) {
        throw err;
      }
    }

}

export async function refreshToken() {
  const dataService = await VSS.getService(VSS.ServiceIds.ExtensionData);
  try {
    const refreshToken = await dataService.getValue('refresh-token', {scopeType: 'User'});
    if (!refreshToken) {
      throw new Error('Refresh token not found.');
    }
    const refreshedAccessToken = await getRefreshedDeviceToken(refreshToken);
    const accessToken = get(refreshedAccessToken, 'data.access_token');
    if (!accessToken) {
      throw new Error('Access token not found in request token response.');
    }
    await dataService.setValue('access-token', accessToken, {scopeType: 'User'});
    return accessToken;
  } catch (e) {
    await dataService.setValue('access-token', null, {scopeType: 'User'});
    await dataService.setValue('refresh-token', null, {scopeType: 'User'});
    console.error(e);
    throw new Error('Get refresh token error.');
  }
}

function urlBase64Decode(str) {
  let output = str.replace(/-/g, '+').replace(/_/g, '/');

  switch (output.length % 4) {
    case 0:
      break;

    case 2:
      output += '==';
      break;

    case 3:
      output += '=';
      break;

    default:
      throw new Error('Illegal base64url string!');
  }
  return decodeURIComponent(escape(atob(output))); //polyfill https://github.com/davidchambers/Base64.js
}

export function decodeToken(token) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('The token is invalid');
  }
  const decoded = urlBase64Decode(parts[1]);
  if (!decoded) {
    throw new Error('Cannot decode the token');
  }
  return JSON.parse(decoded);
}

function getTokenExpirationDate(token) {
  const decoded = decodeToken(token);
  if(typeof decoded.exp === 'undefined') {
    return null;
  }
  const d = new Date(0); // The 0 here is the key, which sets the date to the epoch
  d.setUTCSeconds(decoded.exp);
  return d;
}

function isTokenExpired(token, offsetSeconds = 0) {
  const d = getTokenExpirationDate(token);
  if (d === null) {
    return false;
  }
  // Token expired?
  return !(d.valueOf() > (new Date().valueOf() + (offsetSeconds * 1000)));
}

export const axiosInstance = axios.create({
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 20000
});

// request interceptor to pass auth token
axiosInstance.interceptors.request.use(config => {
  return getToken()
    .then(token => {
      config.headers['Authorization'] = `Bearer ${token}`;
      return config;
    })
    .catch((err) => {
      alert('Failed to get token. Please login from the account tab.');
      console.error(err);
      return config;
    });
});

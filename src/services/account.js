import axios from 'axios';
import qs from 'qs';
import { HOST_URL } from '../config';

import {
  AUTH0_DEVICE_CODE_URL,
  AUTH0_GET_TOKEN_URL,
  AUTH0_CLIENT_ID,
  AUTH0_SCOPE,
  AUTH0_AUDIENCE
} from '../config';

export const axiosInstance = axios.create({
  headers: {
    'Origin': HOST_URL,
    'Access-Control-Request-Method': 'POST',
  },
  timeout: 20000
});

/**
 * Api request for getting device authentication
 * @returns {Promise<*>}
 */
export function getDeviceAuthentication () {
  return axiosInstance.post(AUTH0_DEVICE_CODE_URL, qs.stringify({
    client_id: AUTH0_CLIENT_ID,
    scope: AUTH0_SCOPE,
    audience: AUTH0_AUDIENCE
  }));
}

/**
 * Api request for getting token
 * @param deviceCode the device code from getDeviceAuthentication
 * @returns {Promise<*>}
 */
export function getDeviceToken (deviceCode) {
  return axiosInstance.post(AUTH0_GET_TOKEN_URL, qs.stringify({
    client_id: AUTH0_CLIENT_ID,
    grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
    device_code: deviceCode
  }));
}

/**
 * Api request for getting refreshed token
 * @param deviceCode the device code from getDeviceAuthentication
 * @returns {Promise<*>}
 */
export function getRefreshedDeviceToken (refreshToken) {
  return axiosInstance.post(AUTH0_GET_TOKEN_URL, qs.stringify({
    client_id: AUTH0_CLIENT_ID,
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  }));
}

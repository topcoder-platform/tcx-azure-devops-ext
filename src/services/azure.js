import axios from 'axios';
import { HOST_URL } from '../config';

import {
  AZURE_URL
} from '../config';

export const axiosInstance = axios.create({
  headers: {
    'Origin': HOST_URL,
    'Access-Control-Request-Method': 'POST',
  },
  timeout: 20000
});

// request interceptor to pass auth token
axiosInstance.interceptors.request.use(config => {
  return VSS.getAccessToken().then(token => {
      config.headers['Authorization'] = `Bearer ${token.token}`;
      return config;
    });
});

/**
 * Api request for Work Item
 * @returns {Promise<*>}
 */
export function getWorkItemRelations (project, id) {
  return axiosInstance.get(`${AZURE_URL}/${project}/_apis/wit/workitems/${id}?api-version=6.0&$expand=relations`);
}
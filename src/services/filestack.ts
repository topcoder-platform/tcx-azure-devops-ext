import axios from 'axios';

import {
  FILESTACK_API_URL,
  FILESTACK_API_KEY
} from '../config';

export const axiosInstance = axios.create({
  headers: {
    'Content-Type': 'application/octet-stream'
  },
  timeout: 20000
});

/**
 * Upload data file to filestack
 */
export function upload(data: any, filename: string) {
  return axiosInstance.post(`${FILESTACK_API_URL}/store/S3?key=${FILESTACK_API_KEY}&filename=${filename}`, data);
}
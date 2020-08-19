import qs from 'qs'
import { axiosInstance } from './axiosWithAuth'

const DOMAIN = 'topcoder-dev.com'
const DEV_API_HOSTNAME = `https://api.${DOMAIN}`
const CHALLENGE_API_URL = `${DEV_API_HOSTNAME}/v5/challenges`

/**
 * Fetch challenges from v5 API
 * @param filters
 * @param params
 */
export function fetchChallenges (filters, params) {
  const query = {
    ...filters,
    ...params
  }
  return axiosInstance.get(`${CHALLENGE_API_URL}?${qs.stringify(query, { encode: false })}`)
}
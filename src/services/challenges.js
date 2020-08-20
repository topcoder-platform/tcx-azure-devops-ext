import qs from 'qs'
import { axiosInstance } from './axiosWithAuth'
import { CHALLENGE_API_URL } from '../config'

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
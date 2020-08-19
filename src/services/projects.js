import _ from 'lodash'
import { axiosInstance } from './axiosWithAuth'
import * as queryString from 'query-string'

const DOMAIN = 'topcoder-dev.com'
const DEV_API_HOSTNAME = `https://api.${DOMAIN}`
const PROJECT_API_URL = `${DEV_API_HOSTNAME}/v5/projects`

/**
 * Api request for fetching member's projects
 * @returns {Promise<*>}
 */
export async function fetchMemberProjects (filters) {
  const params = {
    ...filters
  }

  const response = await axiosInstance.get(`${PROJECT_API_URL}?${queryString.stringify(params)}`)
  return _.get(response, 'data')
}

/**
 * Api request for fetching project by id
 * @param id Project id
 * @returns {Promise<*>}
 */
export async function fetchProjectById (id) {
  const response = await axiosInstance.get(`${PROJECT_API_URL}/${id}`)
  return _.get(response, 'data')
}

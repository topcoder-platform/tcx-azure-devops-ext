import _ from 'lodash';
import { axiosInstance } from './axiosWithAuth';
import * as queryString from 'query-string';
import { PROJECT_API_URL } from '../config';

/**
 * Api request for fetching member's projects
 * @returns {Promise<*>}
 */
export async function fetchMemberProjects (filters) {
  const params = {
    ...filters
  };

  const response = await axiosInstance.get(`${PROJECT_API_URL}?${queryString.stringify(params)}`);
  return _.get(response, 'data');
}

/**
 * Api request for fetching project by id
 * @param id Project id
 * @returns {Promise<*>}
 */
export async function fetchProjectById (id) {
  const response = await axiosInstance.get(`${PROJECT_API_URL}/${id}`);
  return _.get(response, 'data');
}

export async function getReport (id) {
  // https://api.topcoder-dev.com/v5/projects/6640/reports/embed?reportName=summary
  const response = await axiosInstance.get(`${PROJECT_API_URL}/${id}/reports/embed?reportName=summary`);
  return _.get(response, 'data');
}
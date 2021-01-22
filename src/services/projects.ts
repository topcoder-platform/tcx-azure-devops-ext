import _ from 'lodash';
import { axiosInstance } from './axiosWithAuth';
import queryString from 'query-string';
import { PROJECT_API_URL } from '../config';

/**
 * Api request for fetching member's projects
 */
export async function fetchMemberProjects(filters: any) {
  let total = Infinity;
  let page = 1;
  const items = [];
  while (items.length !== total) {
    const params = {
      ...filters,
      page
    };
    const response = await axiosInstance.get(`${PROJECT_API_URL}?${queryString.stringify(params)}`);
    items.push(..._.get(response, 'data'));
    total = Number(_.get(response, 'headers.x-total'));
    page += 1;
  }
  return items;
}

/**
 * Api request for fetching project by id
 * @param id Project id
 */
export async function fetchProjectById(id: string) {
  const response = await axiosInstance.get(`${PROJECT_API_URL}/${id}`);
  return _.get(response, 'data');
}

export async function getReport(id: string) {
  // https://api.topcoder-dev.com/v5/projects/6640/reports/embed?reportName=summary
  const response = await axiosInstance.get(`${PROJECT_API_URL}/${id}/reports/embed?reportName=summary`);
  return _.get(response, 'data');
}

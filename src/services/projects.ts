import get from 'lodash/get';
import queryString from 'query-string';

import { axiosInstance } from './axiosWithAuth';
import { PROJECT_API_URL } from '../config';
import { ICreateProjectPayload, ITopcoderProjectType } from '../types/tc-projects';

/**
 * Api request for fetching member's projects
 */
export async function fetchMemberProjects(filters: any) {
  let totalPages = Infinity;
  let page = 1;
  const items = [];
  const moreRequests = [];
  while (page <= totalPages) {
    const params = {
      ...filters,
      page
    };
    const url = `${PROJECT_API_URL}?${queryString.stringify(params)}`;
    if (page === 1) {
      const response = await axiosInstance.get(url);
      items.push(...get(response, 'data'));
      totalPages = Number(get(response, 'headers.x-total-pages'));
    } else {
      moreRequests.push(axiosInstance.get(url));
    }
    page += 1;
  }
  const responses = await Promise.all(moreRequests);
  const projects = responses.reduce((acc, res) => {
    acc.push(...res.data);
    return acc;
  }, items);
  return projects;
}

/**
 * Api request for fetching project by id
 * @param id Project id
 */
export async function fetchProjectById(id: string) {
  const response = await axiosInstance.get(`${PROJECT_API_URL}/${id}`);
  return get(response, 'data');
}

export async function getReport(id: string) {
  // https://api.topcoder-dev.com/v5/projects/6640/reports/embed?reportName=summary
  const response = await axiosInstance.get(`${PROJECT_API_URL}/${id}/reports/embed?reportName=summary`);
  return get(response, 'data');
}

export async function getProjectTypes() {
  const response = await axiosInstance.get(`${PROJECT_API_URL}/metadata/projectTypes`);
  return get(response, 'data') as ITopcoderProjectType[];
}

export async function createProject(payload: ICreateProjectPayload) {
  const response = await axiosInstance.post(PROJECT_API_URL, payload);
  console.log(get(response, 'data'));
  return get(response, 'data');
}

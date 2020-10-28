import qs from 'qs';
import assign from 'lodash/assign';

import { axiosInstance } from './axiosWithAuth';
import {
  CHALLENGE_API_URL,
  NEW_CHALLENGE_TEMPLATE,
  TYPE_ID_TASK,
  DEFAULT_TIMELINE_TEMPLATE_ID,
  DEFAULT_TRACK_ID
} from '../config';

/**
 * Fetch challenges from v5 API
 * @param filters
 * @param params
 */
export function fetchChallenges (filters, params) {
  const query = {
    ...filters,
    ...params
  };
  return axiosInstance.get(`${CHALLENGE_API_URL}?${qs.stringify(query, { encode: false })}`);
}

export function createChallenge (challenge) {
  const body = assign({}, NEW_CHALLENGE_TEMPLATE, {
    typeId: TYPE_ID_TASK,
    name: challenge.name,
    privateDescription: challenge.privateDescription,
    description: challenge.detailedRequirements,
    prizeSets: [{
      type: 'placement',
      prizes: [{type: 'USD', value: challenge.prize}]
    }],
    legacy: {
      ...(NEW_CHALLENGE_TEMPLATE.legacy || {}),
      directProjectId: challenge.directProjectId
    },
    startDate: new Date().toISOString(),
    timelineTemplateId: DEFAULT_TIMELINE_TEMPLATE_ID,
    projectId: challenge.projectId,
    trackId: DEFAULT_TRACK_ID
  });

  return axiosInstance.post(`${CHALLENGE_API_URL}`, body);
}

export function getChallenge (challengeId) {
  return axiosInstance.get(`${CHALLENGE_API_URL}/${challengeId}`);
}
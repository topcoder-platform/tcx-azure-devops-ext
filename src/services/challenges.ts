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
 * @param params
 */
export function fetchChallenges(params: any = {}) {
  const queryString = qs.stringify(params, { encode: false });
  return axiosInstance.get(`${CHALLENGE_API_URL}?${queryString}`);
}

/**
 * Creates a TC Challenge
 * @param challenge TC Challenge Properties
 */
export function createChallenge(challenge: any) {
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

/**
 * Gets the details for a particular Topcoder Challenge
 * @param challengeId Challenge ID
 */
export function getChallenge(challengeId: string) {
  return axiosInstance.get(`${CHALLENGE_API_URL}/${challengeId}`);
}

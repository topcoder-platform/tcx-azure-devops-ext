import qs from 'qs';
import assign from 'lodash/assign';
import omit from 'lodash/omit';
import omitBy from 'lodash/omitBy';
import isNil from 'lodash/isNil';
import pick from 'lodash/pick';

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
 * Creates or Update a TC Challenge
 * @param challenge TC Challenge Properties
 */
export function createOrUpdateChallenge(challenge: any) {
  const isUpdate = /[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}/i.test(challenge.challengeId);
  let body = omitBy(assign({}, NEW_CHALLENGE_TEMPLATE, {
    typeId: TYPE_ID_TASK,
    name: challenge.name,
    privateDescription: challenge.privateDescription,
    description: challenge.detailedRequirements,
    prizeSets: [{
      type: 'placement',
      prizes: [{type: 'USD', value: challenge.prize}]
    }],
    startDate: new Date().toISOString(),
    timelineTemplateId: DEFAULT_TIMELINE_TEMPLATE_ID,
    projectId: challenge.projectId,
    trackId: DEFAULT_TRACK_ID
  }), isNil);
  if (!challenge.prize) {
    body = omit(body, ['prizeSets']);
  }
  if (!challenge.privateDescription) {
    body = omit(body, ['privateDescription']);
  }
  if (isUpdate) {
    if (challenge.status) {
      body = assign(body, {
        status: challenge.status
      });
    }
    return axiosInstance.patch(
      `${CHALLENGE_API_URL}/${challenge.challengeId}`,
      pick(body, ['name', 'description', 'privateDescription', 'prizeSets', 'status'])
    );
  } else {
    return axiosInstance.post(`${CHALLENGE_API_URL}`, body);
  }
}

/**
 * Gets the details for a particular Topcoder Challenge
 * @param challengeId Challenge ID
 */
export function getChallenge(challengeId: string) {
  return axiosInstance.get(`${CHALLENGE_API_URL}/${challengeId}`);
}

/**
 * Creates new attachment
 * @param challengeId Challenge id to add an attachment
 * @param attachment Attachment object
 */
export function createAttachment(challengeId: string, attachment: any) {
  return axiosInstance.post(`${CHALLENGE_API_URL}/${challengeId}/attachments`, attachment);
}

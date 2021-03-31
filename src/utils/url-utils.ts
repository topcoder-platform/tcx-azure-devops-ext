import template from 'lodash/template';

import {
  WEBSITE,
  WEBSITE_CONNECT,
  CHALLENGE_DIRECT_LINK_TEMPLATE,
  CHALLENGE_ONLINE_REVIEW_LINK_TEMPLATE,
  WORK_MANAGER
} from '../config';

/**
 * Generate direct url for given direct project id
 * @param directProjectId
 */
export function directUrl(directProjectId: string) {
  return `${WEBSITE}/direct/projectOverview.action?formData.projectId=${directProjectId}`;
}

/**
 * Generate connect url for given project id
 * @param id
 */
export function connectUrl(id: string) {
  return `${WEBSITE_CONNECT}/projects/${id}`;
}

/**
 * Generate work manager url for given project id and challenge id
 * @param id
 */
export function workManagerUrl(projectId: string, challengeId: string) {
  return `${WORK_MANAGER}/projects/${projectId}/challenges/${challengeId}/view`;
}

/**
 * Generate challenge url for given challenge id
 * @param id
 */
export function challengeUrl(id: string) {
  return `${WEBSITE}/challenges/${id}`;
}

/**
 * Generate OR link for given challenge id
 * @param id
 */
export function onlineReviewUrl(legacyChallengeId: string) {
  return template(CHALLENGE_ONLINE_REVIEW_LINK_TEMPLATE)({ legacyChallengeId });
}

/**
 * Generates url to challenge in TC Direct for given legacy challenge id
 * @param legacyChallengeId
 */
export function challengeDirectUrl(legacyChallengeId: string) {
  return template(CHALLENGE_DIRECT_LINK_TEMPLATE)({ legacyChallengeId });
}

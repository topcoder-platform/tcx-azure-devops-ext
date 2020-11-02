import template from 'lodash/template';

import {
  WEBSITE,
  WEBSITE_CONNECT,
  CHALLENGE_DIRECT_LINK_TEMPLATE,
  CHALLENGE_ONLINE_REVIEW_LINK_TEMPLATE
} from '../config';

/**
 * Generate direct url for given direct project id
 * @param {string} directProjectId
 * @return {string}
 */
export function directUrl(directProjectId) {
  return `${WEBSITE}/direct/projectOverview.action?formData.projectId=${directProjectId}`;
}

/**
 * Generate connect url for given project id
 * @param {string} id
 * @return {string}
 */
export function connectUrl(id) {
  return `${WEBSITE_CONNECT}/projects/${id}`;
}

/**
 * Generate challenge url for given challenge id
 * @param {string} id string
 * @return {string}
 */
export function challengeUrl(id) {
  return `${WEBSITE}/challenges/${id}`;
}

/**
 * Generate OR link for given challenge id
 * @param {string} id
 * @return {string}
 */
export function onlineReviewUrl(legacyChallengeId) {
  return template(CHALLENGE_ONLINE_REVIEW_LINK_TEMPLATE)({ legacyChallengeId });
}

/**
 * Generates url to challenge in TC Direct for given legacy challenge id
 * @param {string} legacyChallengeId
 * @return {string}
 */
export function challengeDirectUrl(legacyChallengeId) {
  return template(CHALLENGE_DIRECT_LINK_TEMPLATE)({ legacyChallengeId });
}

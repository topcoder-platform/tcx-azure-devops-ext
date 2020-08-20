import { WEBSITE } from '../config'
import { WEBSITE_CONNECT } from '../config'

/**
 * Generate direct url for given direct project id
 * @param directProjectId
 * @return string
 */
function directUrl(directProjectId) {
  return `${WEBSITE}/direct/projectOverview.action?formData.projectId=${directProjectId}`;
}

/**
 * Generate connect url for givenproject id
 * @param id
 * @return string
 */
function connectUrl(id) {
  return `${WEBSITE_CONNECT}/projects/${id}`;
}

/**
 * Generate challenge url for given challenge id
 * @param id
 * @return string
 */
function challengeUrl(id) {
  return `${WEBSITE}/challenges/${id}`;
}

export { directUrl, connectUrl, challengeUrl };
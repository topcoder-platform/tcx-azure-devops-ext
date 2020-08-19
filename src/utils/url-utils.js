/**
 * Generate direct url for given direct project id
 * @param directProjectId
 * @return string
 */
function directUrl(directProjectId) {
  return `https://www.topcoder-dev.com/direct/projectOverview.action?formData.projectId=${directProjectId}`;
}

/**
 * Generate connect url for givenproject id
 * @param id
 * @return string
 */
function connectUrl(id) {
  return `https://connect.topcoder-dev.com/projects/${id}`;
}

/**
 * Generate challenge url for given challenge id
 * @param id
 * @return string
 */
function challengeUrl(id) {
  return `https://www.topcoder-dev.com/challenges/${id}`;
}

export { directUrl, connectUrl, challengeUrl };
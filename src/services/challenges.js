import qs from 'qs'
import { axiosInstance } from './axiosWithAuth'
import { 
  CHALLENGE_API_URL,
  NEW_CHALLENGE_TEMPLATE, 
  TYPE_ID_FIRST2FINISH, 
  DEFAULT_TIMELINE_TEMPLATE_ID, 
  DEFAULT_TRACK_ID 
} from '../config'
import _ from 'lodash'

/**
 * Fetch challenges from v5 API
 * @param filters
 * @param params
 */
export function fetchChallenges (filters, params) {
  const query = {
    ...filters,
    ...params
  }
  return axiosInstance.get(`${CHALLENGE_API_URL}?${qs.stringify(query, { encode: false })}`)
}

export function createChallenge (challenge) {
  const body = _.assign({}, NEW_CHALLENGE_TEMPLATE, {
    typeId: TYPE_ID_FIRST2FINISH,
    name: challenge.name,
    description: challenge.detailedRequirements,
    prizeSets: [{
      type: 'Challenge prizes',
      prizes: {type: 'money', value: 0}
    }],
    timelineTemplateId: DEFAULT_TIMELINE_TEMPLATE_ID,
    projectId: challenge.projectId,
    trackId: DEFAULT_TRACK_ID
  });

  return axiosInstance.post(`${CHALLENGE_API_URL}`, body);
}
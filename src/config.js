const DOMAIN = process.env.REACT_APP_DOMAIN || 'topcoder-dev.com'
const WEBSITE = `https://www.${DOMAIN}`
const WEBSITE_CONNECT = `https://connect.${DOMAIN}`
const DEV_API_HOSTNAME = `https://api.${DOMAIN}`
const PROJECT_API_URL = `${DEV_API_HOSTNAME}/v5/projects`
const CHALLENGE_API_URL = `${DEV_API_HOSTNAME}/v5/challenges`

const HOST_URL = process.env.REACT_APP_HOST_URL || 'https://afrisalltd.gallerycdn.vsassets.io'
const AZURE_URL = process.env.REACT_APP_AZURE_URL || 'https://dev.azure.com'

const AUTH0_URL = process.env.REACT_APP_AUTH0_URL || 'https://topcoder-dev.auth0.com/oauth'
const AUTH0_DEVICE_CODE_URL = `${AUTH0_URL}/device/code`
const AUTH0_GET_TOKEN_URL = `${AUTH0_URL}/token`

const AUTH0_CLIENT_ID = process.env.REACT_APP_AUTH0_CLIENT_ID || `XDw5NTMOru5D7XOu77kAafblpnKjl4oQ`
const AUTH0_SCOPE = process.env.REACT_APP_AUTH0_SCOPE || `openid profile offline_access refresh_token`
const AUTH0_AUDIENCE = process.env.REACT_APP_AUTH0_AUDIENCE || `https://api.topcoder.com/`

const POLL_TIMEOUT = process.env.REACT_APP_POLL_TIMEOUT ? parseInt(process.env.REACT_APP_POLL_TIMEOUT) : 5 * 60 * 1000 // 5 mins
const POLL_INTERVAL = process.env.REACT_APP_POLL_INTERVAL ? parseInt(process.env.REACT_APP_POLL_INTERVAL) : 10 * 1000 // 10 seconds

const NEW_CHALLENGE_TEMPLATE = process.env.REACT_APP_NEW_CHALLENGE_TEMPLATE || {
  legacy: {
    reviewType: 'community',
    track: 'DEVELOP',
    directProjectId: 7377
  },
  status: 'Draft'
}
const TYPE_ID_FIRST2FINISH = process.env.REACT_APP_TYPE_ID_FIRST2FINISH || '927abff4-7af9-4145-8ba1-577c16e64e2e'
const DEFAULT_TIMELINE_TEMPLATE_ID = process.env.REACT_APP_DEFAULT_TIMELINE_TEMPLATE_ID || '7ebf1c69-f62f-4d3a-bdfb-fe9ddb56861c'
const DEFAULT_TRACK_ID = process.env.REACT_APP_DEFAULT_TIMELINE_TEMPLATE_ID || '9b6fc876-f4d9-4ccb-9dfd-419247628825'

export {
  WEBSITE,
  HOST_URL,
  PROJECT_API_URL,
  CHALLENGE_API_URL,
  WEBSITE_CONNECT,
  AUTH0_DEVICE_CODE_URL,
  AUTH0_GET_TOKEN_URL,
  AUTH0_CLIENT_ID,
  AUTH0_SCOPE,
  AUTH0_AUDIENCE,
  POLL_TIMEOUT,
  POLL_INTERVAL,
  AZURE_URL,
  NEW_CHALLENGE_TEMPLATE,
  TYPE_ID_FIRST2FINISH,
  DEFAULT_TIMELINE_TEMPLATE_ID,
  DEFAULT_TRACK_ID
}
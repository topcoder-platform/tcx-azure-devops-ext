const DOMAIN = process.env.REACT_APP_DOMAIN || 'topcoder-dev.com'
const WEBSITE = `https://www.${DOMAIN}`
const WEBSITE_CONNECT = `https://connect.${DOMAIN}`
const DEV_API_HOSTNAME = `https://api.${DOMAIN}`
const PROJECT_API_URL = `${DEV_API_HOSTNAME}/v5/projects`
const CHALLENGE_API_URL = `${DEV_API_HOSTNAME}/v5/challenges`

const HOST_URL = process.env.REACT_APP_HOST_URL || 'https://afrisalltd.gallerycdn.vsassets.io'

const AUTH0_URL = process.env.REACT_APP_AUTH0_URL || 'https://topcoder-dev.auth0.com/oauth'
const AUTH0_DEVICE_CODE_URL = `${AUTH0_URL}/device/code`
const AUTH0_GET_TOKEN_URL = `${AUTH0_URL}/token`

const AUTH0_CLIENT_ID = process.env.REACT_APP_AUTH0_CLIENT_ID || `XDw5NTMOru5D7XOu77kAafblpnKjl4oQ`
const AUTH0_SCOPE = process.env.REACT_APP_AUTH0_SCOPE || `openid profile offline_access refresh_token`
const AUTH0_AUDIENCE = process.env.REACT_APP_AUTH0_AUDIENCE || `https://api.topcoder.com/`

const POLL_TIMEOUT = process.env.REACT_APP_POLL_TIMEOUT ? parseInt(process.env.REACT_APP_POLL_TIMEOUT) : 5 * 60 * 1000 // 5 mins
const POLL_INTERVAL = process.env.REACT_APP_POLL_INTERVAL ? parseInt(process.env.REACT_APP_POLL_INTERVAL) : 10 * 1000 // 10 seconds

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
  POLL_INTERVAL
}
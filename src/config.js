export const DOMAIN = process.env.REACT_APP_DOMAIN || 'topcoder-dev.com';
export const WEBSITE = `https://www.${DOMAIN}`;
export const WEBSITE_CONNECT = `https://connect.${DOMAIN}`;
export const DEV_API_HOSTNAME = `https://api.${DOMAIN}`;
export const PROJECT_API_URL = `${DEV_API_HOSTNAME}/v5/projects`;
export const CHALLENGE_API_URL = `${DEV_API_HOSTNAME}/v5/challenges`;
export const CHALLENGE_DIRECT_LINK_TEMPLATE = `${WEBSITE}/direct/contest/detail.action?projectId=<%= legacyChallengeId %>`;
export const CHALLENGE_ONLINE_REVIEW_LINK_TEMPLATE = `https://software.${DOMAIN}/review/actions/ViewProjectDetails?pid=<%= legacyChallengeId %>`;

export const HOST_URL = process.env.REACT_APP_HOST_URL || 'https://afrisalltd.gallerycdn.vsassets.io';
export const AZURE_URL = process.env.REACT_APP_AZURE_URL || 'https://dev.azure.com';

export const AUTH0_URL = process.env.REACT_APP_AUTH0_URL || 'https://topcoder-dev.auth0.com/oauth';
export const AUTH0_DEVICE_CODE_URL = `${AUTH0_URL}/device/code`;
export const AUTH0_GET_TOKEN_URL = `${AUTH0_URL}/token`;

export const AUTH0_CLIENT_ID = process.env.REACT_APP_AUTH0_CLIENT_ID || `XDw5NTMOru5D7XOu77kAafblpnKjl4oQ`;
export const AUTH0_SCOPE = process.env.REACT_APP_AUTH0_SCOPE || `openid profile offline_access refresh_token`;
export const AUTH0_AUDIENCE = process.env.REACT_APP_AUTH0_AUDIENCE || `https://api.topcoder.com/`;

export const POLL_TIMEOUT = process.env.REACT_APP_POLL_TIMEOUT ? parseInt(process.env.REACT_APP_POLL_TIMEOUT) : 5 * 60 * 1000; // 5 mins
export const POLL_INTERVAL = process.env.REACT_APP_POLL_INTERVAL ? parseInt(process.env.REACT_APP_POLL_INTERVAL) : 10 * 1000; // 10 seconds

export const NEW_CHALLENGE_TEMPLATE = process.env.REACT_APP_NEW_CHALLENGE_TEMPLATE ? JSON.parse(process.env.REACT_APP_NEW_CHALLENGE_TEMPLATE) : {
  legacy: {
    reviewType: 'community',
    track: 'DEVELOP',
    subTrack: 'CODE'
  },
  phases: [
    {
      phaseId: 'a93544bc-c165-4af4-b55e-18f3593b457a',
      duration: 561540
    },
    {
      phaseId: '6950164f-3c5e-4bdc-abc8-22aaf5a1bd49',
      duration: 561300
    },
    {
      phaseId: 'aa5a3f78-79e0-4bf7-93ff-b11e8f5b398b',
      duration: 172800
    },
    {
      phaseId: '1c24cfb3-5b0a-4dbd-b6bd-4b0dff5349c6',
      duration: 86400
    },
    {
      phaseId: '797a6af7-cd3f-4436-9fca-9679f773bee9',
      duration: 43200
    }
  ],
  tags: ['Other'],
  status: 'Draft'
};
export const TYPE_ID_TASK = process.env.TYPE_ID_TASK || '927abff4-7af9-4145-8ba1-577c16e64e2e';
export const DEFAULT_TIMELINE_TEMPLATE_ID = process.env.REACT_APP_DEFAULT_TIMELINE_TEMPLATE_ID || '7ebf1c69-f62f-4d3a-bdfb-fe9ddb56861c';
export const DEFAULT_TRACK_ID = process.env.REACT_APP_DEFAULT_TRACK_ID || '9b6fc876-f4d9-4ccb-9dfd-419247628825';

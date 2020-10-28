import { getDeviceToken } from '../services/account';
import { POLL_TIMEOUT, POLL_INTERVAL } from '../config';

/**
 * Function to poll token. It will periodically get the token
 * to see if the user has finished the login and the token is ready
 * @param deviceCode device code from `getDeviceAuthentication`
 * @returns {Promise<*>}
 */
export default function poll(deviceCode) {
  return new Promise(function(resolve, reject) {
    var timeout;
    const interval = setInterval(() => {
      getDeviceToken(deviceCode).then(res => {
        clearInterval(interval);
        if (timeout) clearTimeout(timeout);
        resolve({token: res.data.access_token, refreshToken: res.data.refresh_token});
      }).catch(e => {
        console.log(e);
      });
    }, POLL_INTERVAL);
    timeout = setTimeout(() => {
      clearInterval(interval);
      reject(new Error('Poll token timeout.'));
    }, POLL_TIMEOUT);
  });
}
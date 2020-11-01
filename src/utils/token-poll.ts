/**
 * Function to poll token. It will periodically get the token
 * to see if the user has finished the login and the token is ready
 * @param fn Function to be invoked after each interval
 * @param intervalInS Interval after which function will be invoked
 * @param timeoutInS Timeout
 */
export async function poll<T>(
  fn: Function,
  intervalInS: number,
  timeoutInS: number
): Promise<T> {
  // Setup Timeout
  const timeout = setTimeout(() => {
    throw new Error('Poll token timeout.');
  }, timeoutInS * 1000);
  while (true) {
    await new Promise(resolve => setInterval(resolve, intervalInS * 1000));
    try {
      const val = await fn();
      clearTimeout(timeout);
      return val;
    } catch (err) {
      console.log(err);
    }
  }
}

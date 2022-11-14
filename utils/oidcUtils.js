/*eslint-disable */
/**
 * Util providing common function for OIDC flow
 * @module oidcUtils
 */
const { interactive } = require('./interactive.js');
const {
  requestUserInput,
} = require('./apiUtil');

// Decode JWT token and find the Nonce value
function findNonce(idToken) {
  try {
    const data = idToken.split('.'); // [0] headers, [1] payload, [2] whatever
    const payload = data[1];
    const padding = '='.repeat(4 - (payload.length % 4));
    const decodedData = Buffer.from((payload + padding), 'base64').toString();
    // If the decoded data doesn't contain a nonce, that means the refresh token has expired
    const nonceStr = JSON.parse(decodedData).nonce; // output: test-nounce-<number>
    if (nonceStr === undefined) {
      return 'Could not find nonce. Make sure your id_token is not expired.';
    }
    return parseInt(nonceStr.split('-')[2], 10);
  } catch (e) {
    console.error(e);
    return null;
  }
}

async function runVerifyNonceScenario(nonceVal) {
  const idToken = await requestUserInput('Please paste in your ID Token to verify the nonce: ');
  const result = await interactive(`
            1. [Automated] Compare nonces:
               This is the nonce from the previous scenario: ${nonceVal}
               And this is the nonce obtained after decoding your ID Token: ${findNonce(idToken)}
               Result: ${nonceVal === findNonce(idToken)}
            2. Confirm if the numbers match.
        `);
  return result;
}

function assembleCustomHeaders(ACCESS_TOKEN) {
  // Add ACCESS_TOKEN to custom headers
  return {
    Accept: 'application/json',
    Authorization: `bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  };
}


exports.assembleCustomHeaders = assembleCustomHeaders;
exports.findNonce = findNonce;
exports.runVerifyNonceScenario = runVerifyNonceScenario;
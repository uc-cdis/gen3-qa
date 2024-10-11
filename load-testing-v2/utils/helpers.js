import http from 'k6/http';
import encoding from 'k6/encoding';

export let options = {
  vus: 10,
  duration: '1m',
};

/**
 * Reads the credential.json, returns token, api_key and target_environment
 * @param {object} env - environment variables object
 * When env.PATH_TO_APIKEY is not set, then env.ACCESS_TOKEN, env.GEN3_HOST, env.ACCESS_TOKEN and env.API_KEY must be set
 * via other means.
 */
export function setApiKeyAccessTokenAndHost(env, credentials) {
  console.log("HERE, HERE, HERE");
  let creds = {};
  if (credentials) {
    creds = getApiKeyAndTargetEnvironment(credentials);
    console.log(`Target Env: ${creds.targetEnvironment}`);
    if(!env.ACCESS_TOKEN){
      let token = getAccessTokenFromApiKey(creds)
        .then((access_token) => {
          console.log(`access_token: ${access_token}`);
          return access_token;
        }).catch((reason) => {
          console.log(`Failed to get access token from API Key in ${creds.targetEnvironment}. Response: ${reason.status} - ${reason.statusText}`);
          return null;
        });
      env.ACCESS_TOKEN = token;
    }

    if(!env.GEN3_HOST){
      console.log("UPDATING env.GEN3_HOST");
      env.GEN3_HOST = creds.targetEnvironment;
    }
    console.log(`GEN3_HOST: ${env.GEN3_HOST}`);

    if(!env.API_KEY){
      console.log("UPDATING env.API_KEY");
      env.API_KEY = creds.apiKey;
    }
  }
}

/**
 * Reads the credential.json, returns api_key and target_environment
 * @param {string} pathToCredentialsJson - path to the credential.json
 * @returns {object} - { apiKey, targetEnvironment }
 */
function getApiKeyAndTargetEnvironment(credentials) {
  console.log(`Credentials file content: ${credentials.key_id}`);
  const apiKey = credentials.api_key;
  const data = apiKey.split('.'); // [0] headers, [1] payload, [2] signature
  const payload = data[1];
  //console.log(`Payload: ${payload}`);
  const padding = '='.repeat(4 - (payload.length % 4));
  const decodedData = encoding.b64decode(payload + padding, 'std', 's');
  //console.log(`Decoded Data: ${decodedData}`);
  const targetEnvironment = JSON.parse(decodedData).iss.split('/')[2];
  console.log(`Target Environment: ${targetEnvironment}`);
  return {
    apiKey,
    targetEnvironment,
  };
}

/**
 * Returns the access token by instrumenting the fence http api
 * @param {string} api_key - api key from credentials.json (downloaded by an authenticated user)
 * @returns {string}
 */
function getAccessTokenFromApiKey(creds) {
  const url = `https://${creds.targetEnvironment}/user/credentials/cdis/access_token`;
  const body = JSON.stringify({ api_key: creds.apiKey });  
  console.log(`Getting access token from ${url}`);
  //console.log(`With body: ${body}`);
  return new Promise(((resolve, reject) => {
    http.request({
      url: url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: body
    }).then(
      (resp) => resolve(JSON.parse(resp.body).access_token),
      (err) => reject(err.response || err),
    );
  }));
}
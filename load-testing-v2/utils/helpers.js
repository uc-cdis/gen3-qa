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
export function getCommonVariables(env, credentials) {
  console.log("INITIAL COMMON VARIABLE VALUES");
  console.log(`VIRTUAL_USERS: ${env.VIRTUAL_USERS}`);
  console.log(`GEN3_HOST: ${env.GEN3_HOST}`);
  console.log(`RELEASE_VERSION: ${env.RELEASE_VERSION}`);
  //console.log(`ACCESS_TOKEN: ${env.ACCESS_TOKEN}`);

  if (credentials) {
    setApiKeyAndGen3Host(env, credentials);
  }

  env.ACCESS_TOKEN_BODY = JSON.stringify({ api_key: env.API_KEY });  
  env.ACCESS_TOKEN_URL = `${env.GEN3_HOST}/user/credentials/cdis/access_token`;
  env.ACCESS_TOKEN_PARAMS = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };

  if(!env.ACCESS_TOKEN){
    env.ACCESS_TOKEN = getAccessTokenFromApiKey(env);
    //console.log(`ACCESS_TOKEN: ${env.ACCESS_TOKEN}`);
  }

  //console.log(`ACCESS_TOKEN_PARAMS: ${JSON.stringify(env.ACCESS_TOKEN_PARAMS, null, 2)}`);
  //console.log(`ACCESS_TOKEN_BODY: ${env.ACCESS_TOKEN_BODY}`);

  const immutableEnv = Object.freeze({ ...env });

  console.log("FINAL COMMON VARIABLE VALUES HAVE BEEN SET");
  return immutableEnv;
}

/**
 * Reads the credential.json, returns api_key and target_environment
 * @param {string} pathToCredentialsJson - path to the credential.json
 * @returns {object} - { apiKey, targetEnvironment }
 */
function setApiKeyAndGen3Host(env, credentials) {
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

  if(!env.GEN3_HOST){
    console.log("UPDATING env.GEN3_HOST");
    env.GEN3_HOST = `https://${targetEnvironment}`;
  }
  console.log(`GEN3_HOST: ${env.GEN3_HOST}`);
  
  if(!env.API_KEY){
    console.log("UPDATING env.API_KEY");
    env.API_KEY = apiKey;
  }
}

/**
 * Gets the access token by instrumenting the fence http api
 * @param {string} env - api key from credentials.json (downloaded by an authenticated user)
 */
export function getAccessTokenFromApiKey(env, params) {  
  console.log(`Getting access token from ${env.ACCESS_TOKEN_URL}`);

  if(!params){
    params = env.ACCESS_TOKEN_PARAMS
  }
  else{
    console.log('');
    console.log('');
    console.log('renewing access token!!!');
  }

  let response = http.post(env.ACCESS_TOKEN_URL, env.ACCESS_TOKEN_BODY, params);

  if(response.status !== 200){
    console.log(`Response: ${response.status}`);
    console.log(`Response Body: ${response.body}`);
  }
  
  return response.json().access_token;
}

export function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
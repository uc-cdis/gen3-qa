/* eslint-disable no-mixed-operators */
/* eslint-disable no-bitwise */
/* eslint-disable one-var */

import { sleep, group, check } from 'k6';
import http from 'k6/http';
import { Rate } from 'k6/metrics';
import { getCommonVariables, getAccessTokenFromApiKey, uuidv4 } from '../../utils/helpers.js';
const myFailRate = new Rate('failed_requests');

const credentials = JSON.parse(open('../../utils/credentials.json'));
console.log(`credentials.key_id: ${credentials.key_id}`);

//Default values:
__ENV.RELEASE_VERSION = __ENV.RELEASE_VERSION || "v3.3.1";
__ENV.NUM_OF_JSONS = __ENV.NUM_OF_JSONS || "5";  //500
__ENV.VIRTUAL_USERS = __ENV.VIRTUAL_USERS || JSON.stringify([
  { "duration": "1s", "target": 1 },
  { "duration": "10s", "target": 10 },
  // { "duration": "300s",  "target": 100 },
  // { "duration": "30s", "target": 1 }
  ]);
console.log(`VIRTUAL_USERS: ${__ENV.VIRTUAL_USERS}`);

const numOfJsons = parseInt(__ENV.NUM_OF_JSONS, 10);
console.log(`numOfJsons: ${numOfJsons}`);

// load all JSONs into memory
const jsons = [];
for (let i = 1; i <= numOfJsons; i += 1) {
  //console.log(`loading JSON file: ${i}`);
  const j = open(`./tmp/${i}.json`); // eslint-disable-line no-restricted-globals
  jsons.push(j);
}

export const options = {
  tags: {
    test_scenario: 'MDS - Filter large database',
    release: __ENV.RELEASE_VERSION,
    test_run_id: (new Date()).toISOString().slice(0, 16),
  },
  stages: JSON.parse(__ENV.VIRTUAL_USERS),
  thresholds: {
    http_req_duration: ['avg<1000', 'p(95)<2000'],
    'failed_requests': ['rate<0.05'],
  },
  noConnectionReuse: true,
};

export function setup() {
  return getCommonVariables(__ENV, credentials);
}

export default function (env) {
  const apiKey = env.API_KEY;
  const accessToken = env.ACCESS_TOKEN;

  const jsonIndex = __ITER % numOfJsons; // eslint-disable-line no-undef
  console.log(`jsonIndex: ${jsonIndex}`);

  const baseUrl = `${env.GEN3_HOST}/mds-admin/metadata`;

  // obtain random guid
  const aGuid = uuidv4();

  const url = `${baseUrl}/${aGuid}`;

  const tokenRefreshParams = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    tags: { name: 'renewingToken1' }
  };

  const jsonData = jsons[jsonIndex];
  // console.log(`data: ${jsonData}`);

  group('Populating the MDS database', () => {
    if (__ITER < numOfJsons) { // eslint-disable-line no-undef
      group('create record in MDS', () => {
        console.log(`sending POST req to: ${url}`);
        const createRecordParams = {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          tags: { name: 'createRecord1' }
        };
        const res = http.post(url, jsonData, createRecordParams);

        // If the ACCESS_TOKEN expires, renew it with the apiKey
        if (res.status === 401) {
          console.log(`Request response: ${res.status}`);
          console.log(`Request response: ${res.body}`);
    
          accessToken = getAccessTokenFromApiKey(env, tokenRefreshParams);
    
          console.log(`NEW ACCESS TOKEN!: ${accessToken}`);
        } else {
          // console.log(`Request performed: ${new Date()}`);
          console.log(`Request response: ${res.status}`);
          myFailRate.add(res.status !== 201);
          if (res.status !== 201) {
            console.log(`Request response: ${res.status}`);
            console.log(`Request response: ${res.body}`);
          }
          check(res, {
            'is status 201': (r) => r.status === 201,
          });
        }
      });
      group('wait 0.3s between requests', () => {
        sleep(0.3);
      });
    } else {
      group('query large database', () => {
        console.log(`sending GET req to: ${baseUrl}?dbgap.consent_code=2`);
        const getRecordParams = {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          tags: { name: 'query large db' }
        };
        const res = http.get(`${baseUrl}?dbgap.consent_code=2`, getRecordParams);
        // console.log(`Request performed: ${new Date()}`);
        myFailRate.add(res.status !== 200);
        if (res.status !== 200) {
          console.log(`Request response: ${res.status}`);
          console.log(`Request response: ${res.body}`);
        }
        check(res, {
          'is status 200': (r) => r.status === 200,
        });
      });
      group('wait 0.3s between requests', () => {
        sleep(0.3);
      });
    }
  });
}

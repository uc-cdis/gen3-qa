/* eslint-disable no-mixed-operators */
/* eslint-disable no-bitwise */
/* eslint-disable one-var */

import { sleep, group, check } from 'k6';
import http from 'k6/http';
import { Rate } from 'k6/metrics';
import { getCommonVariables, uuidv4 } from '../../utils/helpers.js';
const myFailRate = new Rate('failed_requests');

const credentials = JSON.parse(open('../../utils/credentials.json'));
console.log(`credentials.key_id: ${credentials.key_id}`);

//Default values:
__ENV.RELEASE_VERSION = __ENV.RELEASE_VERSION || "v3.3.1";
__ENV.BASIC_AUTH = __ENV.BASIC_AUTH || "";
// __ENV.BASIC_AUTH = __ENV.BASIC_AUTH || JSON.stringify({
//   "username": "",
//   "password": ""
// });
__ENV.MDS_TEST_DATA = __ENV.MDS_TEST_DATA || JSON.stringify({
  "filter1": "a=1",
  "filter2": "nestedData.b=2",
  "fictitiousRecord1": {
    "a": 1
  },
  "fictitiousRecord2": {
    "nestedData": {
      "b": 2
    }
  }
});
__ENV.VIRTUAL_USERS = __ENV.VIRTUAL_USERS || JSON.stringify([
  { "duration": "1s", "target": 1 },
  { "duration": "10s", "target": 10 },
  { "duration": "300s",  "target": 100 },
  { "duration": "30s", "target": 1 }
  ]);
console.log(`VIRTUAL_USERS: ${__ENV.VIRTUAL_USERS}`);

const {
  BASIC_AUTH,
  MDS_TEST_DATA,
  RELEASE_VERSION,
  VIRTUAL_USERS
} = __ENV; // eslint-disable-line no-undef

export const options = {
  tags: {
    test_scenario: 'MDS - Create and query',
    release: RELEASE_VERSION,
    test_run_id: (new Date()).toISOString().slice(0, 16),
  },
  stages: JSON.parse(VIRTUAL_USERS),
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
  // console.log(`MDS_TEST_DATA_JSON: ${MDS_TEST_DATA}`);
  const MDS_TEST_DATA_JSON = JSON.parse(MDS_TEST_DATA);

  // console.log(`BASIC_AUTH.lenght: ${BASIC_AUTH.length}`);
  const mdsEndpoint = BASIC_AUTH.length > 0 ? 'mds' : 'mds-admin';
  const baseUrl = `${env.GEN3_HOST}/${mdsEndpoint}/metadata`;

  // random guids
  const guid1 = uuidv4();
  const guid2 = uuidv4();

  const url1 = `${baseUrl}/${guid1}`;
  const url2 = `${baseUrl}/${guid2}`;

  console.log(`sending requests to: ${baseUrl}`);

  const auth = BASIC_AUTH.length > 0 ? `Basic ${BASIC_AUTH}` : `Bearer ${env.ACCESS_TOKEN}`;

  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: auth,
    },
  };
  const body1 = JSON.stringify(MDS_TEST_DATA_JSON.fictitiousRecord1);
  const body2 = JSON.stringify(MDS_TEST_DATA_JSON.fictitiousRecord2);

  group('Creating and querying records', () => {
    group('create fictitiousRecord1', () => {
      console.log(`sending POST req to: ${url1}`);
      const res = http.post(url1, body1, params, { tags: { name: 'createRecord1' } });
      // console.log(`Request performed: ${new Date()}`);
      myFailRate.add(res.status !== 201);
      if (res.status !== 201) {
        console.log(`Request response: ${res.status}`);
        console.log(`Request response: ${res.body}`);
      }
      check(res, {
        'is status 201': (r) => r.status === 201,
      });
    });
    group('wait 0.3s between requests', () => {
      sleep(0.3);
    });
    group('create fictitiousRecord2', () => {
      console.log(`sending POST req to: ${url2}`);
      const res = http.post(url2, body2, params, { tags: { name: 'createRecord2' } });
      // console.log(`Request performed: ${new Date()}`);
      myFailRate.add(res.status !== 201);
      if (res.status !== 201) {
        console.log(`Request response: ${res.status}`);
        console.log(`Request response: ${res.body}`);
      }
      check(res, {
        'is status 201': (r) => r.status === 201,
      });
    });
    group('wait 0.3s between requests', () => {
      sleep(0.3);
    });
    group('query fictitiousRecord1', () => {
      console.log(`sending GET req to: ${baseUrl}?${MDS_TEST_DATA_JSON.filter1}`);
      const res = http.get(`${baseUrl}?${MDS_TEST_DATA_JSON.filter1}`, params, { tags: { name: 'queryRecord1' } });
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
    group('query fictitiousRecord2', () => {
      console.log(`sending GET req to: ${baseUrl}?${MDS_TEST_DATA_JSON.filter2}`);
      const res = http.get(`${baseUrl}?${MDS_TEST_DATA_JSON.filter2}`, params, { tags: { name: 'queryRecord2' } });
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
    group('delete fictitiousRecord1', () => {
      console.log(`sending DELETE req to: ${url1}`);
      const res = http.request('DELETE', url1, {}, params, { tags: { name: 'deleteRecord1' } });
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
    group('delete fictitiousRecord2', () => {
      console.log(`sending DELETE req to: ${url2}`);
      const res = http.request('DELETE', url2, {}, params, { tags: { name: 'deleteRecord2' } });
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
  });
}

/* eslint-disable no-mixed-operators */
/* eslint-disable no-bitwise */
/* eslint-disable one-var */

import { sleep, group, check } from 'k6';
import http from 'k6/http';
import { Rate } from 'k6/metrics';
import { getCommonVariables } from '../../utils/helpers.js';
const myFailRate = new Rate('failed_requests');

const credentials = JSON.parse(open('../../utils/credentials.json'));
console.log(`credentials.key_id: ${credentials.key_id}`);

//Default values:
__ENV.RELEASE_VERSION = __ENV.RELEASE_VERSION || "v3.3.1";
__ENV.VIRTUAL_USERS = __ENV.VIRTUAL_USERS || JSON.stringify([
  { "duration": "1s", "target": 1 },
  { "duration": "10s", "target": 10 },
  // { "duration": "60s", "target": 10 },
  // { "duration": "60s", "target": 50 },
  // { "duration": "60s", "target": 100 },
  // { "duration": "60s", "target": 150 },
  // { "duration": "60s", "target": 200 },
  // { "duration": "60s", "target": 200 },
  // { "duration": "120s", "target": 0 }
  ]);
console.log(`VIRTUAL_USERS: ${__ENV.VIRTUAL_USERS}`);

export const options = {
  tags: {
    test_scenario: 'Portal - Study Viewer',
    release: __ENV.RELEASE_VERSION,
    test_run_id: (new Date()).toISOString().slice(0, 16),
  },
  stages: JSON.parse(__ENV.VIRTUAL_USERS),
  thresholds: {
    http_req_duration: ['avg<250'],
    'failed_requests': ['rate<0.1'],
  },
  noConnectionReuse: true,
};

export function setup() {
  return getCommonVariables(__ENV, credentials);
}

export default function (env) {
  const url = `${env.GEN3_HOST}/study-viewer/clinical_trials`;

  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.ACCESS_TOKEN}`,
    },
    tags: { name: 'NIAID Study Viewer' }
  };
  group('Visiting the study viewer page', () => {
    group('http get', () => {
      console.log(`Shooting requests against: ${url}`);
      const res = http.get(url, params);
      // console.log(`Request performed: ${new Date()}`);
      // console.log(`Request response status: ${res.status}`);
      // console.log(`Request response body: ${res.body}`);

      myFailRate.add(res.status !== 200);
      if (res.status !== 200) {
        console.log(`Request response status: ${res.status}`);
        console.log(`Request response body: ${res.body}`);
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

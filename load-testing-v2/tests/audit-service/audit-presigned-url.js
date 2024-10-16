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

if (!__ENV.VIRTUAL_USERS) {
  __ENV.VIRTUAL_USERS = JSON.stringify([
    { "target": 1 }
  ]);
}
console.log(`VIRTUAL_USERS: ${__ENV.VIRTUAL_USERS}`);

export const options = {
  tags: {
    test_scenario: 'Audit service - Presigned URL',
    release: __ENV.RELEASE_VERSION,
    test_run_id: (new Date()).toISOString().slice(0, 16),
  },
  stages: JSON.parse(__ENV.VIRTUAL_USERS.slice(1, -1)),
  thresholds: {
    http_req_duration: ['avg<1000', 'p(95)<2000'],
    'failed requests': ['rate<0.05'],
  },
  noConnectionReuse: true,
};

export function setup() {
  return getCommonVariables(__ENV, credentials);
}

export default function (env) {
  const auditURL = `${env.GEN3_HOST}/audit/log/presigned_url`;

  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.ACCESS_TOKEN}`,
    },
  };

  group('getting presigned url logs', () => {
    group('http get', () => {
      console.log(`Getting logs ${auditURL}`);
      const res = http.get(auditURL, params);
      myFailRate.add(res.status !== 200);
      if (res.status !== 200) {
        console.log(`${res.status}`);
        console.log(`${res.body}`);
      }
      check(res, {
        'is status 200': (r) => r.status === 200,
      });
    });
  });
}

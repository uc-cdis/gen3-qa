/* eslint-disable no-mixed-operators */
/* eslint-disable no-bitwise */
/* eslint-disable one-var */

import { sleep, group, check } from 'k6';
import http from 'k6/http';
import { Rate } from 'k6/metrics';
import { setApiKeyAccessTokenAndHost } from '../../utils/helpers.js';
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
    test_scenario: 'Sheepdog - Export clinical metadata',
    release: __ENV.RELEASE_VERSION,
    test_run_id: (new Date()).toISOString().slice(0, 16),
  },
  stages: JSON.parse(__ENV.VIRTUAL_USERS),
  thresholds: {
    // http_req_duration: ['avg<3000', 'p(95)<15000'],
    'failed_requests': ['rate<0.1'],
  },
  noConnectionReuse: true,
};

export function setup() {
  console.log("ENTERING SETUP");
  
  console.log(`VIRTUAL_USERS: ${__ENV.VIRTUAL_USERS}`);
  console.log(`GEN3_HOST: ${__ENV.GEN3_HOST}`);
  console.log(`RELEASE_VERSION: ${__ENV.RELEASE_VERSION}`);
  //console.log(`ACCESS_TOKEN: ${__ENV.ACCESS_TOKEN}`);

  setApiKeyAccessTokenAndHost(__ENV, credentials);

  console.log("EXITTINNG SETUP");

  return __ENV;
}

export default function (env) {
  if (__ITER < 2) { // eslint-disable-line no-undef
    const exportUrl = `https://${env.GEN3_HOST}/api/v0/submission/DEV/test/export?node_label=study`;
    console.log(`sending req to: ${exportUrl}`);
    const params = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.ACCESS_TOKEN}`,
      },
    };

    group('Exporting clinical metadata', () => {
      group('http get', () => {
        const res2 = http.get(exportUrl, params, { tags: { name: 'Sheepdog-data-export' } });
        console.log(`Request performed: ${new Date()}`);
        myFailRate.add(res2.status !== 200);
        console.log(`Request response: ${res2.status}`);
        console.log(`Request response: ${res2.body}`);

        check(res2, {
          'is status 200': (r) => r.status === 200,
        });
      });
      group('wait 0.3s between requests', () => {
        sleep(0.3);
      });
    });
  }
}

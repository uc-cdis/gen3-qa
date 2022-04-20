const { check, group, sleep } = require('k6'); // eslint-disable-line import/no-unresolved
const http = require('k6/http'); // eslint-disable-line import/no-unresolved
const { Rate } = require('k6/metrics'); // eslint-disable-line import/no-unresolved

const {
  RELEASE_VERSION,
  GEN3_HOST,
  ACCESS_TOKEN,
  VIRTUAL_USERS,
} = __ENV; // eslint-disable-line no-undef

const myFailRate = new Rate('failed requests');

export const options = {
  tags: {
    test_scenario: 'Sheepdog - Export clinical metadata',
    release: RELEASE_VERSION,
    test_run_id: (new Date()).toISOString().slice(0, 16),
  },
  stages: JSON.parse(VIRTUAL_USERS.slice(1, -1)),
  thresholds: {
    // http_req_duration: ['avg<3000', 'p(95)<15000'],
    'failed requests': ['rate<0.1'],
  },
  noConnectionReuse: true,
};

export default function () {
  if (__ITER < 2) { // eslint-disable-line no-undef
    const exportUrl = `https://${GEN3_HOST}/api/v0/submission/DEV/test/export?node_label=subject`;
    console.log(`sending req to: ${exportUrl}`);
    const params = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ACCESS_TOKEN}`,
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

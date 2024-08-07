const { check, group } = require('k6'); // eslint-disable-line import/no-unresolved
const http = require('k6/http'); // eslint-disable-line import/no-unresolved
const { Rate } = require('k6/metrics'); // eslint-disable-line import/no-unresolved

const {
  ACCESS_TOKEN,
  RELEASE_VERSION,
  GEN3_HOST,
  VIRTUAL_USERS,
} = __ENV; // eslint-disable-line no-undef

const myFailRate = new Rate('failed requests');

export const options = {
  tags: {
    test_scenario: 'Audit service - Login',
    release: RELEASE_VERSION,
    test_run_id: (new Date()).toISOString().slice(0, 16),
  },
  stages: JSON.parse(VIRTUAL_USERS.slice(1, -1)),
  thresholds: {
    http_req_duration: ['avg<1000', 'p(95)<2000'],
    'failed requests': ['rate<0.05'],
  },
  noConnectionReuse: true,
};

export default function () {
  const auditURL = `https://${GEN3_HOST}/audit/log/login`;

  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
  };

  group('getting login logs', () => {
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

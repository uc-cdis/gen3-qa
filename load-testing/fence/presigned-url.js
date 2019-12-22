const { check, group, sleep } = require('k6'); // eslint-disable-line import/no-unresolved
const http = require('k6/http'); // eslint-disable-line import/no-unresolved
const { Rate } = require('k6/metrics'); // eslint-disable-line import/no-unresolved

const { GUIDS_LIST, GEN3_HOST, ACCESS_TOKEN } = __ENV; // eslint-disable-line no-undef

// __ENV.GUIDS_LIST is only set when `random-guids` is triggered
const guids = GUIDS_LIST ? GUIDS_LIST.split(',') : '00037250-f2e5-47e2-863c-5f225c7f79e8';

const myFailRate = new Rate('failed requests');

export const options = {
  rps: 90000,
  stages: [
    { duration: '30s', target: 1 },
    { duration: '60s', target: 5 },
    { duration: '60s', target: 5 },
    { duration: '60s', target: 10 },
    { duration: '60s', target: 10 },
    { duration: '60s', target: 15 },
    { duration: '60s', target: 15 },
    { duration: '60s', target: 20 },
    { duration: '60s', target: 20 },
    { duration: '60s', target: 30 }, // Throughput impact starts here
    { duration: '60s', target: 30 },
    { duration: '60s', target: 40 },
    { duration: '60s', target: 40 },
    { duration: '60s', target: 50 }, // Objective
    { duration: '60s', target: 50 },
    { duration: '60s', target: 50 },
    { duration: '60s', target: 50 },
    { duration: '60s', target: 30 },
    { duration: '60s', target: 10 },
    { duration: '60s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['avg<3000', 'p(95)<15000'],
    'failed requests': ['rate<0.1'],
  },
  noConnectionReuse: true,
};

export default function () {
  const url = `https://${GEN3_HOST}/user/data/download/${guids[Math.floor(Math.random() * guids.length)]}?protocol=s3`;
  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
  };
  group('Sending PreSigned URL request', () => {
    group('http get', () => {
      const res = http.get(url, params, { tags: { name: 'PreSignedURL' } });
      console.log(`Request performed: ${new Date()}`);
      myFailRate.add(res.status !== 200);
      check(res, {
        'is status 200': (r) => r.status === 200,
      });
    });
    group('wait 1 sec between requests', () => {
      sleep(1);
    });
  });
}

const { check } = require('k6'); // eslint-disable-line import/no-unresolved
const http = require('k6/http'); // eslint-disable-line import/no-unresolved
const { Rate } = require('k6/metrics'); // eslint-disable-line import/no-unresolved

const { GUIDS_LIST, GEN3_HOST, ACCESS_TOKEN } = __ENV; // eslint-disable-line no-undef

// __ENV.GUIDS_LIST is only set when `random-guids` is triggered
const guids = GUIDS_LIST ? GUIDS_LIST.split(',') : '00037250-f2e5-47e2-863c-5f225c7f79e8';

const myFailRate = new Rate('failed requests');

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '60s', target: 50 },
    { duration: '60s', target: 50 },
    { duration: '60s', target: 50 },
    { duration: '60s', target: 50 },
    { duration: '60s', target: 50 },
    { duration: '30s', target: 20 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['avg<100', 'p(95)<300'],
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
  const res = http.get(url, params);
  myFailRate.add(res.status !== 200);
  check(res, {
    'is status 200': (r) => r.status === 200,
  });
}

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
    /* { duration: '30s', target: 1 },
    { duration: '30s', target: 5 },
    { duration: '30s', target: 10 },
    { duration: '60s', target: 20 },
    { duration: '60s', target: 30 },
    { duration: '60s', target: 40 },
    { duration: '60s', target: 50 },
    { duration: '60s', target: 50 },
    { duration: '60s', target: 50 },
    { duration: '60s', target: 50 },
    { duration: '60s', target: 60 },
    { duration: '60s', target: 70 },
    { duration: '60s', target: 50 },
    { duration: '60s', target: 30 },
    { duration: '60s', target: 0 }, */
    { duration: '1s', target: 1 },
    { duration: '5s', target: 1 },
    { duration: '1s', target: 2 },
    { duration: '5s', target: 2 },
    { duration: '1s', target: 3 },
    { duration: '5s', target: 3 },
    { duration: '1s', target: 4 },
    { duration: '5s', target: 4 },
    { duration: '1s', target: 5 },
    { duration: '5s', target: 5 },
    { duration: '1s', target: 6 },
    { duration: '5s', target: 6 },
    { duration: '1s', target: 7 },
    { duration: '5s', target: 7 },
    { duration: '1s', target: 8 },
    { duration: '5s', target: 8 },
    { duration: '1s', target: 9 },
    { duration: '5s', target: 9 },
    { duration: '1s', target: 10 },
    { duration: '10s', target: 10 },
    { duration: '1s', target: 11 },
    { duration: '10s', target: 11 },
    { duration: '1s', target: 12 },
    { duration: '10s', target: 12 },
    { duration: '1s', target: 13 },
    { duration: '10s', target: 13 },
    { duration: '1s', target: 14 },
    { duration: '10s', target: 14 },
    { duration: '1s', target: 15 },
    { duration: '10s', target: 15 },
    { duration: '1s', target: 16 },
    { duration: '10s', target: 16 },
    { duration: '1s', target: 17 },
    { duration: '10s', target: 17 },
    { duration: '1s', target: 18 },
    { duration: '10s', target: 18 },
    { duration: '1s', target: 19 },
    { duration: '10s', target: 19 },
    { duration: '1s', target: 20 },
    { duration: '10s', target: 20 },
    { duration: '1s', target: 21 },
    { duration: '15s', target: 21 },
    { duration: '1s', target: 22 },
    { duration: '15s', target: 22 },
    { duration: '1s', target: 23 },
    { duration: '15s', target: 23 },
    { duration: '1s', target: 24 },
    { duration: '15s', target: 24 },
    { duration: '1s', target: 25 },
    { duration: '15s', target: 25 },
    { duration: '1s', target: 26 },
    { duration: '15s', target: 26 },
    { duration: '1s', target: 27 },
    { duration: '15s', target: 27 },
    { duration: '1s', target: 28 },
    { duration: '15s', target: 28 },
    { duration: '1s', target: 29 },
    { duration: '15s', target: 29 },
    { duration: '1s', target: 30 },
    { duration: '15s', target: 30 },
    { duration: '1s', target: 31 },
    { duration: '15s', target: 31 },
    { duration: '1s', target: 32 },
    { duration: '15s', target: 32 },
    { duration: '1s', target: 33 },
    { duration: '15s', target: 33 },
    { duration: '1s', target: 34 },
    { duration: '15s', target: 34 },
    { duration: '1s', target: 35 },
    { duration: '15s', target: 35 },
    { duration: '1s', target: 36 },
    { duration: '15s', target: 36 },
    { duration: '1s', target: 37 },
    { duration: '15s', target: 37 },
    { duration: '1s', target: 38 },
    { duration: '15s', target: 38 },
    { duration: '1s', target: 39 },
    { duration: '15s', target: 39 },
    { duration: '1s', target: 40 },
    { duration: '15s', target: 40 },
    { duration: '1s', target: 40 },
    { duration: '15s', target: 40 },
    { duration: '1s', target: 41 },
    { duration: '15s', target: 41 },
    { duration: '1s', target: 42 },
    { duration: '15s', target: 42 },
    { duration: '1s', target: 43 },
    { duration: '15s', target: 43 },
    { duration: '1s', target: 44 },
    { duration: '15s', target: 44 },
    { duration: '1s', target: 45 },
    { duration: '15s', target: 45 },
    { duration: '1s', target: 46 },
    { duration: '15s', target: 46 },
    { duration: '1s', target: 47 },
    { duration: '15s', target: 47 },
    { duration: '1s', target: 48 },
    { duration: '15s', target: 48 },
    { duration: '1s', target: 49 },
    { duration: '15s', target: 49 },
    { duration: '1s', target: 50 },
    { duration: '15s', target: 50 },
    /* { duration: '20s', target: 20 },
    { duration: '60s', target: 20 },
    { duration: '60s', target: 20 },
    { duration: '60s', target: 30 },
    { duration: '60s', target: 30 },
    { duration: '60s', target: 40 },
    { duration: '60s', target: 40 },
    { duration: '60s', target: 50 },
    { duration: '60s', target: 50 },
    { duration: '60s', target: 50 },
    { duration: '60s', target: 50 },
    { duration: '60s', target: 30 },
    { duration: '60s', target: 10 },
    { duration: '60s', target: 0 }, */
  ],
  thresholds: {
    http_req_duration: ['avg<3000', 'p(95)<15000'],
    'failed requests': ['rate<0.1'],
  },
  noConnectionReuse: true,
};

export default function () {
  const url = `https://${GEN3_HOST}/user/data/download/${guids[Math.floor(Math.random() * guids.length)]}?protocol=s3`;
  // const url = `https://${GEN3_HOST}/user/data/download/dg.4503/c52a9f3a-7c6d-4416-ae82-130258b1bb42?protocol=s3`;
  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
  };
  group('Sending PreSigned URL request', () => {
    group('http get', () => {
      // console.log(`Shooting requests against: ${url}`);
      const res = http.get(url, params, { tags: { name: 'PreSignedURL' } });
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

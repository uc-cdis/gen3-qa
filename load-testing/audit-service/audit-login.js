const { check, group, sleep } = require('k6'); // eslint-disable-line import/no-unresolved
const http = require('k6/http'); // eslint-disable-line import/no-unresolved
const { Rate } = require('k6/metrics'); // eslint-disable-line import/no-unresolved
// const { uuid }= require('uuid');

const {
  ACCESS_TOKEN,
  GEN3_HOST,
  VIRTUAL_USERS,
} = __ENV; // eslint-disable-line no-undef

const myFailRate = new Rate('failed requests');

export const options = {
  stages: JSON.parse(VIRTUAL_USERS.slice(1, -1)),
  thresholds: {
    http_req_duration: ['avg<1000', 'p(95)<2000'],
    'failed requests': ['rate<0.05'],
  },
  noConnectionReuse: true,
};

export default function () {
  //https://${GEN3_HOST}/audit/log/login
  const auditSqsURL = `https://${GEN3_HOST}/audit/log/login`;

  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
  };

  // const schema = {
  //   idp: 'fence',
  //   request_url: '',
  //   status_code: 200,
  //   sub: 1,
  //   username: 'user10',
  // };
  //
  // const body = JSON.stringify(schema);
  //
  // group('posting login logs', () => {
  //   group('http post', () => {
  //     console.log(`posting login logs to: ${auditSqsURL}`);
  //     const res = http.post(auditSqsURL, body, params, { tags: { name: 'login' } });
  //     myFailRate.add(res.status !== 201);
  //     if (res.status !== 201) {
  //       console.log(`Request response Status: ${res.status}`);
  //       console.log(`Request response Body: ${res.body}`);
  //     }
  //     check(res, {
  //       'is status 201': (r) => r.status === 201,
  //     });
  //   });
  //   group('wait 0.3s between requests', () => {
  //     sleep(0.3);
  //   });
  // });

  group('getting login logs', () => {
    group('http get', () => {
      console.log(`Getting logs ${auditSqsURL}`);
      const res = http.get(auditSqsURL, params);
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

/* eslint-disable no-mixed-operators */
/* eslint-disable no-bitwise */
/* eslint-disable one-var */
const {
  check,
  group,
  sleep,
//  fail
} = require('k6'); // eslint-disable-line import/no-unresolved
const http = require('k6/http'); // eslint-disable-line import/no-unresolved
const { Rate } = require('k6/metrics'); // eslint-disable-line import/no-unresolved

const {
//  NUM_OF_RECORDS,
  GEN3_HOST,
  ACCESS_TOKEN,
  VIRTUAL_USERS,
} = __ENV; // eslint-disable-line no-undef

const myFailRate = new Rate('failed requests');

export const options = {
  stages: JSON.parse(VIRTUAL_USERS.slice(1, -1)),
  thresholds: {
    http_req_duration: ['avg<3000', 'p(95)<15000'],
    'failed requests': ['rate<0.1'],
  },
  noConnectionReuse: true,
};

export default function () {
  function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  const url = `https://${GEN3_HOST}/index/index`;
  // console.log(`sending req to: ${url}`);
  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
  };
  const body = {
    acl: ['QA'],
    authz: [],
    did: uuidv4(),
    file_name: 'qa-test.txt',
    form: 'object',
    hashes: {
      md5: '404e8919021a03285697647487f528ef',
    },
    size: 2681688756,
    urls: ['gs://dcf-integration-qa/qa-test.txt', 's3://cdis-presigned-url-test/testdata'],
  };

  const strBody = JSON.stringify(body);
  // console.log(`debugging: ${JSON.stringify(body)}`);

  console.log(`submitting: ${__ITER}`); // eslint-disable-line no-undef

  group('Creating indexd records', () => {
    // TODO: Come up with a way to interrupt the load test
    // When we reach a certain number of records
    console.log(`__ITER: ${__ITER}`); // eslint-disable-line no-undef
    // if (__ITER < NUM_OF_RECORDS) { // eslint-disable-line no-undef
    group('http put', () => {
      const res = http.post(url, strBody, params, { tags: { name: 'Indexd-record-creation' } });
      // console.log(`Request performed: ${new Date()}`);
      myFailRate.add(res.status !== 200);
      if (res.status !== 200) {
        // console.log(`Request response: ${res.status}`);
        console.log(`Request response: ${res.body}`);
      }
      check(res, {
        'is status 200': (r) => r.status === 200,
      });
    });
    group('wait 0.1s between requests', () => {
      sleep(0.1);
    });
    // } else {
    //   fail(`${__ITER} records created on ${GEN3_HOST}`); // eslint-disable-line no-undef
    // }
  });
}

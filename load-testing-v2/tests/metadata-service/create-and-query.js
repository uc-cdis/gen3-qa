import uuid from '../libs/uuid.js'; // eslint-disable-line import/no-unresolved, import/extensions

const { check, group, sleep } = require('k6'); // eslint-disable-line import/no-unresolved
const http = require('k6/http'); // eslint-disable-line import/no-unresolved
const { Rate } = require('k6/metrics'); // eslint-disable-line import/no-unresolved

const {
  ACCESS_TOKEN,
  BASIC_AUTH,
  MDS_TEST_DATA,
  RELEASE_VERSION,
  GEN3_HOST,
  VIRTUAL_USERS,
} = __ENV; // eslint-disable-line no-undef

const myFailRate = new Rate('failed_requests');

export const options = {
  tags: {
    test_scenario: 'MDS - Create and query',
    release: RELEASE_VERSION,
    test_run_id: (new Date()).toISOString().slice(0, 16),
  },
  stages: JSON.parse(VIRTUAL_USERS.slice(1, -1)),
  thresholds: {
    http_req_duration: ['avg<1000', 'p(95)<2000'],
    'failed_requests': ['rate<0.05'],
  },
  noConnectionReuse: true,
};

export default function () {
  // console.log(`MDS_TEST_DATA_JSON: ${MDS_TEST_DATA}`);
  const MDS_TEST_DATA_JSON = JSON.parse(MDS_TEST_DATA.slice(1, -1));
  const MDS_BASIC_AUTH = BASIC_AUTH.slice(1, -1);

  // console.log(`MDS_BASIC_AUTH.lenght: ${MDS_BASIC_AUTH.length}`);
  const mdsEndpoint = MDS_BASIC_AUTH.length > 0 ? 'mds' : 'mds-admin';
  const baseUrl = `https://${GEN3_HOST}/${mdsEndpoint}/metadata`;

  // random guids
  const guid1 = uuid.v4();
  const guid2 = uuid.v4();

  const url1 = `${baseUrl}/${guid1}`;
  const url2 = `${baseUrl}/${guid2}`;

  console.log(`sending requests to: ${baseUrl}`);

  const auth = MDS_BASIC_AUTH.length > 0 ? `Basic ${MDS_BASIC_AUTH}` : `Bearer ${ACCESS_TOKEN}`;

  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: auth,
    },
  };
  const body1 = JSON.stringify(MDS_TEST_DATA_JSON.fictitiousRecord1);
  const body2 = JSON.stringify(MDS_TEST_DATA_JSON.fictitiousRecord2);

  group('Creating and querying records', () => {
    group('create fictitiousRecord1', () => {
      console.log(`sending POST req to: ${url1}`);
      const res = http.post(url1, body1, params, { tags: { name: 'createRecord1' } });
      // console.log(`Request performed: ${new Date()}`);
      myFailRate.add(res.status !== 201);
      if (res.status !== 201) {
        console.log(`Request response: ${res.status}`);
        console.log(`Request response: ${res.body}`);
      }
      check(res, {
        'is status 201': (r) => r.status === 201,
      });
    });
    group('wait 0.3s between requests', () => {
      sleep(0.3);
    });
    group('create fictitiousRecord2', () => {
      console.log(`sending POST req to: ${url2}`);
      const res = http.post(url2, body2, params, { tags: { name: 'createRecord2' } });
      // console.log(`Request performed: ${new Date()}`);
      myFailRate.add(res.status !== 201);
      if (res.status !== 201) {
        console.log(`Request response: ${res.status}`);
        console.log(`Request response: ${res.body}`);
      }
      check(res, {
        'is status 201': (r) => r.status === 201,
      });
    });
    group('wait 0.3s between requests', () => {
      sleep(0.3);
    });
    group('query fictitiousRecord1', () => {
      console.log(`sending GET req to: ${baseUrl}?${MDS_TEST_DATA_JSON.filter1}`);
      const res = http.get(`${baseUrl}?${MDS_TEST_DATA_JSON.filter1}`, params, { tags: { name: 'queryRecord1' } });
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
    group('query fictitiousRecord2', () => {
      console.log(`sending GET req to: ${baseUrl}?${MDS_TEST_DATA_JSON.filter2}`);
      const res = http.get(`${baseUrl}?${MDS_TEST_DATA_JSON.filter2}`, params, { tags: { name: 'queryRecord2' } });
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
    group('delete fictitiousRecord1', () => {
      console.log(`sending DELETE req to: ${url1}`);
      const res = http.request('DELETE', url1, {}, params, { tags: { name: 'deleteRecord1' } });
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
    group('delete fictitiousRecord2', () => {
      console.log(`sending DELETE req to: ${url2}`);
      const res = http.request('DELETE', url2, {}, params, { tags: { name: 'deleteRecord2' } });
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

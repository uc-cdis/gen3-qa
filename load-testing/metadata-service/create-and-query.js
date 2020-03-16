const { check, group, sleep } = require('k6'); // eslint-disable-line import/no-unresolved
const http = require('k6/http'); // eslint-disable-line import/no-unresolved
const { Rate } = require('k6/metrics'); // eslint-disable-line import/no-unresolved

const {
  BASIC_AUTH,
  MDS_TEST_DATA,
  GEN3_HOST,
  VIRTUAL_USERS,
} = __ENV; // eslint-disable-line no-undef

const MDS_TEST_DATA_JSON = JSON.parse(MDS_TEST_DATA.trim());

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
  const baseUrl = `https://${GEN3_HOST}/mds/metadata/`;
  const url1 = `${baseUrl}/${MDS_TEST_DATA_JSON.fictitiousRecord1.guid}`;
  const url2 = `${baseUrl}/${MDS_TEST_DATA_JSON.fictitiousRecord2.guid}`;

  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${BASIC_AUTH}`,
    },
  };
  const body1 = MDS_TEST_DATA_JSON.fictitiousRecord1;
  const body2 = MDS_TEST_DATA_JSON.fictitiousRecord2;

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
      console.log(`sending GET req to: ${baseUrl}/${MDS_TEST_DATA_JSON.filter1}`);
      const res = http.get(`${baseUrl}/${MDS_TEST_DATA_JSON.filter1}`, params, { tags: { name: 'queryRecord1' } });
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
      console.log(`sending GET req to: ${baseUrl}/${MDS_TEST_DATA_JSON.filter2}`);
      const res = http.patch(`${baseUrl}/${MDS_TEST_DATA_JSON.filter2}`, params, { tags: { name: 'queryRecord2' } });
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

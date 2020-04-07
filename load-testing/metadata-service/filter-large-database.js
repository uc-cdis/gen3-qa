import uuid from '../libs/uuid.js'; // eslint-disable-line import/no-unresolved, import/extensions

const { check, group, sleep } = require('k6'); // eslint-disable-line import/no-unresolved
const http = require('k6/http'); // eslint-disable-line import/no-unresolved
const { Rate } = require('k6/metrics'); // eslint-disable-line import/no-unresolved

// declare mutable ACCESS_TOKEN
let { ACCESS_TOKEN } = __ENV; // eslint-disable-line no-undef

const {
  NUM_OF_JSONS,
  API_KEY,
  GEN3_HOST,
  VIRTUAL_USERS,
} = __ENV; // eslint-disable-line no-undef

const myFailRate = new Rate('failed requests');
const numOfJsons = parseInt(NUM_OF_JSONS.slice(1, -1), 10);

// load all JSONs into memory
const jsons = [];
for (let i = 1; i <= numOfJsons; i += 1) {
  const j = open(`../tmp/${i}.json`); // eslint-disable-line no-restricted-globals
  jsons.push(j);
}

export const options = {
  stages: JSON.parse(VIRTUAL_USERS.slice(1, -1)),
  thresholds: {
    http_req_duration: ['avg<1000', 'p(95)<2000'],
    'failed requests': ['rate<0.05'],
  },
  noConnectionReuse: true,
};

export default function () {
  console.log(`num of jsons in the list: ${jsons.length}`);
  const apiKey = API_KEY.slice(1, -1);
  const accessToken = ACCESS_TOKEN;

  console.log(`accessToken: ${accessToken}`);

  const jsonIndex = __ITER; // eslint-disable-line no-undef
  console.log(`jsonIndex: ${jsonIndex}`);

  const baseUrl = `https://${GEN3_HOST}/mds-admin/metadata`;

  // obtain random guid
  const aGuid = uuid.v4();

  const url = `${baseUrl}/${aGuid}`;

  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  };

  const jsonData = jsons[jsonIndex];
  // console.log(`data: ${jsonData}`);

  group('Populating the MDS database', () => {
    group('create record in MDS', () => {
      console.log(`sending POST req to: ${url}`);
      const res = http.post(url, jsonData, params, { tags: { name: 'createRecord1' } });

      // If the ACCESS_TOKEN expires, renew it with the apiKey
      if (res.status === 401) {
        console.log('renewing access token!!!');
        console.log(`Request response: ${res.status}`);
        console.log(`Request response: ${res.body}`);

        const tokenRenewalUrl = `https://${GEN3_HOST}/user/credentials/cdis/access_token`;

        const tokenRenewalParams = {
          headers: {
            'Content-Type': 'application/json',
            accept: 'application/json',
          },
        };
        const tokenRenewalData = JSON.stringify({
          api_key: apiKey,
        });
        const renewalRes = http.post(tokenRenewalUrl, tokenRenewalData, tokenRenewalParams, { tags: { name: 'renewingToken1' } });
        ACCESS_TOKEN = JSON.parse(renewalRes.body).access_token;

        console.log(`NEW ACCESS TOKEN!: ${ACCESS_TOKEN}`);
      } else {
        // console.log(`Request performed: ${new Date()}`);
        myFailRate.add(res.status !== 201);
        if (res.status !== 201) {
          console.log(`Request response: ${res.status}`);
          console.log(`Request response: ${res.body}`);
        }
        check(res, {
          'is status 201': (r) => r.status === 201,
        });
      }
    });
    group('wait 0.3s between requests', () => {
      sleep(0.3);
    });
  });
/*
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
      const res = http.get(
        `${baseUrl}?${MDS_TEST_DATA_JSON.filter1}`,
        params,
        { tags: { name: 'queryRecord1' } }
      );
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
      const res = http.get(
        `${baseUrl}?${MDS_TEST_DATA_JSON.filter2}`,
        params,
        { tags: { name: 'queryRecord2' } }
      );
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
*/
}

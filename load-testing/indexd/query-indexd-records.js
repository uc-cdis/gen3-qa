const { check, group, sleep } = require('k6'); // eslint-disable-line no-undef
const http = require('k6/http'); // eslint-disable-line no-undef
const { Rate } = require('k6/metrics'); // eslint-disable-line no-undef

const {
  GUIDS_LIST,
  GEN3_HOST,
  ACCESS_TOKEN,
  VIRTUAL_USERS,
} = __ENV; // eslint-disable-line no-undef

// __ENV.GUIDS_LIST should contain either a list of GUIDs from load-test-descriptor.json
// or it should be assembled based on an indexd query (requires `indexd_record_url` to fetch DIDs)
const guid = GUIDS_LIST.split(',');

const myFailRate = new Rate('failed requests');

export const options = {
  rps: 90000,
  stages: JSON.parse(VIRTUAL_USERS.slice(1, -1)),
  thresholds: {
    http_req_duration: ['avg<3000', 'p(95)<15000'],
    'failed requests': ['rate<0.1'],
  },
  noConnectionReuse: true,
};

export default function () {
  const url = `https://${GEN3_HOST}/index/index/${guid[Math.floor(Math.random() * guid.length)]}`;
  const params = {
    headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
  };
  group('Querying Index records :', () => {
    group('http get', () => {
      console.log(`Querying indexd recored`);
      const res = https.get(url, params)
      myFailRate.add(res.status !== 200);
      if (res.status !== 200) {
        console.log(`Requesting response: ${res.status}`);
        console.log(`Requesting response: ${res.body}`);
      }
      check(res, {
          'is status 200': (r) => r.status === 200,
      });    
    });
  }
  )


}
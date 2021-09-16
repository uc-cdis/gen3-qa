const {
  check,
  group,
  sleep
} = require('k6'); // eslint-disable-line import/no-unresolved
const http = require('k6/http'); // eslint-disable-line import/no-unresolved
const {
  Rate
} = require('k6/metrics'); // eslint-disable-line import/no-unresolved

const {
  GUIDS_LIST,
  GEN3_HOST,
  ACCESS_TOKEN,
  PASSPORTS_LIST,
  SIGNED_URL_PROTOCOL,
  NUM_PARALLEL_REQUESTS,
} = __ENV; // eslint-disable-line no-undef

// __ENV.GUIDS_LIST should contain either a list of GUIDs from load-test-descriptor.json
const guids = GUIDS_LIST.split(',');

const myFailRate = new Rate('failed requests');

export const options = {
  rps: 90000,
  thresholds: {
    http_req_duration: ['avg<3000', 'p(95)<15000'],
    'failed requests': ['rate<0.1'],
  },
  duration: '45m',
  noConnectionReuse: true,
  iterations: 1
};

export default function() {
  const maxRetries = 5;

  var is_passport_flow = false;
  var params = {
    'headers': {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
    },
  };
  var body = null;

  if (PASSPORTS_LIST !== undefined && PASSPORTS_LIST !== null && PASSPORTS_LIST !== "") {
    console.log(`Passport list supplied: ${PASSPORTS_LIST}. Enabling GA4GH Passport flow to POST list of passports rather than use a Gen3 Access Token.`);
    is_passport_flow = true;
    params = {
      'headers': {
        'Content-Type': 'application/json'
      },
    };
    body = {"passports": PASSPORTS_LIST.split(',')}
    console.log(`Body for DRS requests: ${JSON.stringify(body)}`)
  }

  group('Sending GA4GH DRS API Requests request', () => {
    group('http get', () => {
      let batchRequests = [];
      let batchFailed = false;

      for (let i = 0; i < guids.length; i++) {
        for (let k = i; batchRequests.length < NUM_PARALLEL_REQUESTS && k < guids.length; k++) {
          var url = `https://${GEN3_HOST}/ga4gh/drs/v1/objects/${guids[k]}/access/${SIGNED_URL_PROTOCOL}`;

          batchRequests.push(['GET', url, body, params]);
          i = k;
        }

        // now we have a batch of requests ready
        var failedRequestBatches = 0;
        for (var retries = maxRetries; retries > 0; retries--) {
          console.log(`Requesting data access for: ${batchRequests}`);

          // batch in k6 sends requests "in parallel over multiple TCP connections"
          let responses = http.batch(batchRequests);

          for (let j = 0; j < responses.length; j++) {
            check(responses[j], {
              'is status 200': (r) => r.status === 200,
            });
            myFailRate.add(responses[j].status !== 200);

            if (responses[j].status != 200) {
              batchFailed = true;
            }
          }

          // if any fail, retry the whole batch to simplify logic here
          if (batchFailed) {
            console.log(`Got some failed responses in batch. Will retry.`);
            console.log(`      ${retries} retries left...`);

            failedRequestBatches += 1;

            // crude backoff logic (wait n+1 seconds until trying again where n is the number
            // of failed requests in a row)
            sleep(failedRequestBatches + 1);
          } else {
            // all successful, we don't need to retry
            break;
          }
        }

        // reset batch for next one
        batchFailed = false;
        batchRequests = [];
      }
    });
  });
}
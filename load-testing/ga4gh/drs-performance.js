/*
Test to simulate a client/user attempting to get x number of signed URLs
given a list of studies (in the form of `authz` resources).

In other words, we can answer the question "How long does it take to get
10,000 signed URLs across 3 studies in Gen3?"

The test is not designed with parallelized users
(there is only 1 virtual user),
as it's meant to simulate a single person trying to
get all the data they care about.

**We are assuming the client/user is parallelizing their requests**.
We accomplish that with k6's `batch` support for requests.

**We also assume the client/user is retrying failed requests**
(like the rate limiting 503s) with some simple backoff logic
(for each batch of requests, if any failed, keep retrying the
failed requests up to 5 times with increasing sleep time in between).

Due to the potential high number of GUIDs that could be requested,
we are not able to use the existing
`GUIDS_LIST` that other similar load tests use
(as it exceeded the max size of commands in linux -
it gets passed to a k6 process as a command line arg).
To circumvent this, the logic of paginating and obtaining the GUIDs
is built into this test.

There is sufficient flexibility for adjusting num GUIDs,
num parallel requests, pagination size, authz resources, etc.
*/

const {
  check,
  group,
  sleep,
} = require('k6'); // eslint-disable-line import/no-unresolved
const http = require('k6/http'); // eslint-disable-line import/no-unresolved
const {
  Rate,
} = require('k6/metrics'); // eslint-disable-line import/no-unresolved

const {
  TARGET_ENV,
  AUTHZ_LIST,
  MINIMUM_RECORDS,
  RECORD_CHUNK_SIZE,
  RELEASE_VERSION,
  GEN3_HOST,
  ACCESS_TOKEN,
  PASSPORTS_LIST,
  SIGNED_URL_PROTOCOL,
  NUM_PARALLEL_REQUESTS,
  MTLS_DOMAIN,
  MTLS_CERT,
  MTLS_KEY,
} = __ENV; // eslint-disable-line no-undef

const myFailRate = new Rate('failed_requests');

let rawOptions = { // eslint-disable-line prefer-const
  tags: {
    test_scenario: 'DRS Performace',
    release: RELEASE_VERSION,
    test_run_id: (new Date()).toISOString().slice(0, 16),
  },
  rps: 90000,
  thresholds: {
    http_req_duration: ['avg<3000', 'p(95)<15000'],
    'failed_requests': ['rate<0.1'],
  },
  duration: '2h',
  noConnectionReuse: true,
  iterations: 1,
};

if (`${MTLS_DOMAIN}` !== 'test') {
  console.log('Enabling Mutual TLS with the follow configuration:\n'
    + `MTLS_DOMAIN: ${MTLS_DOMAIN}\nMTLS_CERT: ${MTLS_CERT}\nMTLS_KEY: ${MTLS_KEY}`); // eslint-disable-line
  rawOptions.tlsAuth = [
    {
      domains: [`${MTLS_DOMAIN}`],
      cert: open(MTLS_CERT), // eslint-disable-line no-restricted-globals
      key: open(MTLS_KEY), // eslint-disable-line no-restricted-globals
    },
  ];
}

export const options = rawOptions;

export default function () {
  const maxRetries = 5;

  let method = 'GET';

  let params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
  };
  let requestBody = null;

  if (PASSPORTS_LIST !== undefined && PASSPORTS_LIST !== null && PASSPORTS_LIST !== '') {
    console.log(`Passport list supplied: ${PASSPORTS_LIST}. Enabling GA4GH Passport flow to POST list of passports rather than use a Gen3 Access Token.`);
    method = 'POST';
    params = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    requestBody = {
      passports: PASSPORTS_LIST.split(','),
    };
  }
  console.log(`Body for DRS requests: ${JSON.stringify(requestBody)}`);

  console.log('attempting to get random GUIDs...');

  let indexdPaginationPageNum = 0;
  let minimumRecords = 1;
  let recordChunkSize = 1024;

  if (MINIMUM_RECORDS !== null) {
    minimumRecords = MINIMUM_RECORDS;
  }

  if (RECORD_CHUNK_SIZE !== null) {
    recordChunkSize = RECORD_CHUNK_SIZE;
  }

  const listOfDIDs = [];
  // as long as we don't have enough records, continue to loop over provided ACL / Authz
  // and attempt to bump the page number for indexd's pagination
  while (listOfDIDs.length < minimumRecords) {
    console.log(`listOfDIDs.length ${listOfDIDs.length} < minimumRecords ${minimumRecords}... paginate to page ${indexdPaginationPageNum} in indexd`);
    console.log(`parsing authz list ${AUTHZ_LIST}`);
    const indexdRecordAuthzListSplit = AUTHZ_LIST.split(',');

    for (const authz of indexdRecordAuthzListSplit) {
      console.log(`Requesting GUIDs for authz ${authz} from ${TARGET_ENV}`);
      const url = `https://${TARGET_ENV}/index/index?authz=${authz}&limit=${recordChunkSize}&page=${indexdPaginationPageNum}`;
      console.log(`fetching guids from ${url}`);
      const resp = http.get(url, {
        'content-type': 'application/json',
        accept: 'application/json',
      }, {});

      const body = JSON.parse(resp.body);
      for (const record of body.records) {
        listOfDIDs.push(record.did);
      }
    }
    indexdPaginationPageNum += 1;
  }

  console.log(`found ${listOfDIDs.length} GUIDs in total`);

  group('Sending GA4GH DRS API Requests request', () => {
    group('http get', () => {
      let batchRequests = {};
      let retryRequired = false;

      for (let i = 0; i < listOfDIDs.length; i += 1) {
        for (let k = i;
          Object.keys(batchRequests).length < NUM_PARALLEL_REQUESTS && k < listOfDIDs.length;
          k += 1) {
          const url = `https://${GEN3_HOST}/ga4gh/drs/v1/objects/${listOfDIDs[k]}/access/${SIGNED_URL_PROTOCOL}`;

          console.log(`Adding request to batch: ${url}`);
          batchRequests[`${listOfDIDs[k]}`] = {
            method,
            url,
            body: JSON.stringify(requestBody),
            params,
          };
          i = k;
        }

        // now we have a batch of requests ready
        console.log(`Prepared full batch of ${Object.keys(batchRequests).length} requests.`);
        let failedRequestBatches = 0;
        for (let retries = maxRetries; retries > 0; retries -= 1) {
          console.log(`  Sending ${Object.keys(batchRequests).length} batched request(s)...`);

          // batch in k6 sends requests "in parallel over multiple TCP connections"
          const responses = http.batch(batchRequests);

          for (const guid in responses) {
            if (Object.prototype.hasOwnProperty.call(responses, guid)) {
              check(responses[guid], {
                'is status 200': (r) => r.status === 200,
              });
              myFailRate.add(responses[guid].status !== 200);

              // remove successful requests
              if (responses[guid].status === 200) {
                delete batchRequests[guid];
              }

              if (responses[guid].status !== 200) {
                console.log(`    Failed request for ${guid} - ${responses[guid].status}:${responses[guid].body}`);
                retryRequired = true;
              }
            } else {
              console.log('ERROR: Response does not contain guid');
            }
          }

          // if any fail, retry
          if (retryRequired) {
            console.log(`    Got ${Object.keys(batchRequests).length} failed request(s) in batch. Will retry.`);
            console.log(`      ${retries} retries left...`);

            failedRequestBatches += 1;

            // crude backoff logic (wait n+1 seconds until trying again where n is the number
            // of failed requests in a row)
            console.log(`      Backing off, sleeping for ${failedRequestBatches + 1} seconds...`);
            sleep(failedRequestBatches + 1);

            // reset batch for next one
            retryRequired = false;
          } else {
            // all successful, we don't need to retry
            console.log('Successfully completed full batch of requests.');
            break;
          }
        }

        // reset batch for next one
        retryRequired = false;
        batchRequests = {};
      }
    });
  });
}

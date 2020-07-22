const {
  check,
  group,
  sleep,
  fail,
} = require('k6'); // eslint-disable-line import/no-unresolved
const http = require('k6/http'); // eslint-disable-line import/no-unresolved
const { Rate } = require('k6/metrics'); // eslint-disable-line import/no-unresolved

const {
  NUM_OF_RECORDS,
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
  const url = `https://${GEN3_HOST}/api/v0/submission/jnkns/jenkins/`;
  console.log(`sending req to: ${url}`);
  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
  };
  const body = {
    eligibility: false,
    index_date: null,
    amputation_type: '6f9b1f1084',
    derived_parent_subject_id: '5c41ec1d49',
    derived_topmed_subject_id: '2fb4aae615',
    '*studies': {
      submitter_id: 'study_f2246d2c4d',
    },
    '*consent_codes': [],
    project_id: 'DEV-test',
    '*submitter_id': `subject_6769d601552${__ITER}`, // eslint-disable-line no-undef
    transplanted_organ: '1671409e2e',
    unit_geographic_site: 'a0761970f8',
    '*type': 'subject',
    cohort_id: 'Postmortem',
    geographic_site: 'c75bf740d9',
  };
  const strBody = JSON.stringify(body);
  console.log(`debugging: ${JSON.stringify(body)}`);

  console.log(`submitting subject data: subject_6769d601552${__ITER}`); // eslint-disable-line no-undef

  group('Importing and exporting clinical metadata', () => {
    if (__ITER < NUM_OF_RECORDS) { // eslint-disable-line no-undef
      group('http put', () => {
        const res = http.put(url, strBody, params, { tags: { name: 'Sheepdog-data-submission' } });
        console.log(`Request performed: ${new Date()}`);
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
    } else {
      fail(`${__ITER} records created on ${GEN3_HOST}`); // eslint-disable-line no-undef
    }
  });
}

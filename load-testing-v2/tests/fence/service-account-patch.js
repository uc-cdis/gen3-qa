const { check, group, sleep } = require('k6'); // eslint-disable-line import/no-unresolved
const http = require('k6/http'); // eslint-disable-line import/no-unresolved
const { Rate } = require('k6/metrics'); // eslint-disable-line import/no-unresolved

const {
  GOOGLE_SVC_ACCOUNT,
  GOOGLE_PROJECTS_LIST,
  //  GOOGLE_PROJECT_ID, // only required when the account is being registered, not patched
  GEN3_HOST,
  RELEASE_VERSION,
  ACCESS_TOKEN,
  VIRTUAL_USERS,
} = __ENV; // eslint-disable-line no-undef

const googleProjects = GOOGLE_PROJECTS_LIST.split(',');

const myFailRate = new Rate('failed requests');

export const options = {
  tags: {
    test_scenario: 'Fence - Patch service account',
    release: RELEASE_VERSION,
    test_run_id: (new Date()).toISOString().slice(0, 16),
  },
  stages: JSON.parse(VIRTUAL_USERS.slice(1, -1)),
  thresholds: {
    http_req_duration: ['avg<3000', 'p(95)<15000'],
    'failed requests': ['rate<0.1'],
  },
  noConnectionReuse: true,
};

export default function () {
  const url = `https://${GEN3_HOST}/user/google/service_accounts/${GOOGLE_SVC_ACCOUNT}`;
  console.log(`sending req to: ${url}`);
  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
  };
  const body = {
    project_access: googleProjects.splice(
      Math.floor(Math.random() * googleProjects.length),
      Math.floor(Math.random() * googleProjects.length),
    ),
  };
  console.log(`patching with project_access: ${JSON.stringify(body)}`);

  group('Sending PATCH google svc account request', () => {
    group('http patch', () => {
      // console.log(`Shooting requests against: ${url}`);
      const res = http.patch(url, body, params, { tags: { name: 'GoogleSvcAccountPatch' } });
      // console.log(`Request performed: ${new Date()}`);
      myFailRate.add(res.status !== 204);
      if (res.status !== 204) {
        console.log(`Request response: ${res.status}`);
        console.log(`Request response: ${res.body}`);
      }
      check(res, {
        'is status 204': (r) => r.status === 204,
      });
    });
    group('wait 0.3s between requests', () => {
      sleep(0.3);
    });
  });
}

const { check, group, sleep } = require('k6'); // eslint-disable-line import/no-unresolved
const http = require('k6/http'); // eslint-disable-line import/no-unresolved
const { Rate } = require('k6/metrics'); // eslint-disable-line import/no-unresolved

const {
  RELEASE_VERSION,
  TARGET_ENVIRONMENT,
  VIRTUAL_USERS,
} = __ENV; // eslint-disable-line no-undef

const myFailRate = new Rate('failed requests');

console.log('Running scenario - dicom-server-metadata');

export const options = {
  tags: {
    scenario: 'Dicom Server - Metadata',
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

export function setup() {
  const METADATA_URLS = [];
  const DICOM_SERVER_URL = `https://${TARGET_ENVIRONMENT}/dicom-server`;
  const studies = http.get(`${DICOM_SERVER_URL}/studies`).json();
  console.log(studies);
  studies.forEach((study) => {
    const res = http.get(`${DICOM_SERVER_URL}/studies/${study.id}`).json();
    const studyInstanceUid = res.MainDicomTags.StudyInstanceUID;
    const seriesIds = res.Series;
    seriesIds.forEach((seriesId) => {
      METADATA_URLS.append(`${DICOM_SERVER_URL}/dicom-web/${studyInstanceUid}/series/${seriesId}/metadata`);
    });
  });
  console.log(METADATA_URLS);
  return METADATA_URLS;
}

export default function (data) {
  let currentUrlNumber = 0;
  group('Fetch series metadata', () => {
    const res = http.get(data[currentUrlNumber], { tags: { name: 'Dicom Series Metadata' } });
    if (currentUrlNumber === data.length - 1) {
      currentUrlNumber = 0;
    } else {
      currentUrlNumber += 1;
    }
    myFailRate.add(res.status !== 200);
    if (res.status !== 200) {
      console.log(`Request response: ${res.status}`);
      console.log(`Request response: ${res.body}`);
    }
    check(res, {
      'is status 200': (r) => r.status === 200,
    });
    sleep(0.1);
  });
}

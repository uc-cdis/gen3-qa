const { check, group, sleep } = require('k6'); // eslint-disable-line import/no-unresolved
const http = require('k6/http'); // eslint-disable-line import/no-unresolved
const { Rate } = require('k6/metrics'); // eslint-disable-line import/no-unresolved

const {
  GEN3_HOST,
  RELEASE_VERSION,
  TARGET_ENVIRONMENT,
  VIRTUAL_USERS,
} = __ENV; // eslint-disable-line no-undef

const myFailRate = new Rate('failed requests');

console.log('Running scenario - dicom-server-metadata');
console.log(VIRTUAL_USERS);
// console.log(JSON.parse(VIRTUAL_USERS.slice(1, -1)));
export const options = {
  tags: {
    scenario: 'Dicom Server - Metadata',
    release: RELEASE_VERSION,
    test_run_id: (new Date()).toISOString().slice(0, 16),
  },
  stages: [
    { duration: '10s', target: 10 },
    { duration: '10s', target: 50 },
    { duration: '10s', target: 100 },
    { duration: '10s', target: 150 },
  ],
  thresholds: {
    http_req_duration: ['avg<3000', 'p(95)<15000'],
    'failed requests': ['rate<0.1'],
  },
  noConnectionReuse: true,
};

export function setup() {
  console.log('Setting up...');
  const METADATA_URLS = [];
  const DICOM_SERVER_URL = `https://${GEN3_HOST}/dicom-server`;
  const studies = JSON.parse(http.get(`${DICOM_SERVER_URL}/studies`).body);
  // console.log(studies);
  let studyUrl = '';
  studies.forEach((study) => {
    console.log(study);
    studyUrl = `${DICOM_SERVER_URL}/studies/${study}`;
    const res = JSON.parse(http.get(studyUrl).body);
    // console.log(studyUrl);
    const studyInstanceUid = res.MainDicomTags.StudyInstanceUID;
    console.log(studyInstanceUid);
    const seriesIds = res.Series;
    console.log(seriesIds);
    seriesIds.forEach((seriesId) => {
      // console.log(seriesId);
      const seriesUrl = `${DICOM_SERVER_URL}/series/${seriesId}`;
      const seriesInstanceUid = JSON.parse(http.get(seriesUrl).body).MainDicomTags.SeriesInstanceUID;
      const metadataUrl = `${DICOM_SERVER_URL}/dicom-web/${studyInstanceUid}/series/${seriesInstanceUid}`;
      console.log(metadataUrl);
      METADATA_URLS.push(metadataUrl);
    });
  });
  console.log(METADATA_URLS);
  return METADATA_URLS;
}

export default function (data) {
  console.log('Running scenario...');
  let currentUrlNumber = 0;
  group('Fetch series metadata', () => {
    const res = http.get(data[currentUrlNumber],
      {
        Accept: 'multipart/related; type="application/dicom"; transfer-syntax=*',
      });
    console.log(JSON.stringify(res));
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

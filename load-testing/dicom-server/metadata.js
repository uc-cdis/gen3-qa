const { check, group, sleep } = require('k6'); // eslint-disable-line import/no-unresolved
const http = require('k6/http'); // eslint-disable-line import/no-unresolved
const { Rate } = require('k6/metrics'); // eslint-disable-line import/no-unresolved

const {
  GEN3_HOST,
  RELEASE_VERSION,
  VU_COUNT,
  DURATION,
  ACCESS_TOKEN,
} = __ENV; // eslint-disable-line no-undef

const myFailRate = new Rate('failed requests');
console.log('Running scenario - dicom-server-metadata');
export const options = {
  tags: {
    scenario: 'Dicom Server - Metadata',
    release: RELEASE_VERSION,
    test_run_id: (new Date()).toISOString().slice(0, 16),
  },
  stages: [
    { duration: '30s', target: VU_COUNT },
    { duration: `${DURATION}s`, target: VU_COUNT },
    { duration: '30s', target: 0 },
  ],
  noConnectionReuse: true,
};

export function setup() {
  console.log('Setting up...');
  const METADATA_URLS = [];
  const DICOM_SERVER_URL = `https://${GEN3_HOST}/dicom-server`;
  const studies = JSON.parse(http.get(`${DICOM_SERVER_URL}/studies`, { Authorization: `Bearer ${ACCESS_TOKEN}` }).body);
  // console.log(studies);
  let studyUrl = '';
  studies.forEach((study) => {
    // console.log(study);
    studyUrl = `${DICOM_SERVER_URL}/studies/${study}`;
    const res = JSON.parse(http.get(studyUrl, { Authorization: `Bearer ${ACCESS_TOKEN}` }).body);
    // console.log(studyUrl);
    const studyInstanceUid = res.MainDicomTags.StudyInstanceUID;
    // console.log(studyInstanceUid);
    const seriesIds = res.Series;
    // console.log(seriesIds);
    seriesIds.forEach((seriesId) => {
      // console.log(seriesId);
      const seriesUrl = `${DICOM_SERVER_URL}/series/${seriesId}`;
      const seriesInstanceUid = JSON.parse(http.get(seriesUrl, { Authorization: `Bearer ${ACCESS_TOKEN}` }).body).MainDicomTags.SeriesInstanceUID;
      const metadataUrl = `${DICOM_SERVER_URL}/dicom-web/studies/${studyInstanceUid}/series/${seriesInstanceUid}/metadata`;
      // console.log(metadataUrl);
      METADATA_URLS.push(metadataUrl);
    });
  });
  console.log(METADATA_URLS);
  return METADATA_URLS;
}

export default function (data) {
  console.log('Running scenario...');
  const url = data[Math.floor(Math.random() * data.length)];
  group('Fetch series metadata', () => {
    const res = http.get(url,
      {
        Accept: 'application/dicom+json',
        'Accept-Encoding': 'gzip, deflate, br',
      });
    myFailRate.add(res.status !== 200);
    if (res.status !== 200) {
      console.log(`Errored on ${url} with status ${res.status}`);
    }
    check(res, {
      'is status 200': (r) => r.status === 200,
    });
    sleep(0.1);
  });
}

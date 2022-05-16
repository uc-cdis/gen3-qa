const { sleep } = require('k6'); // eslint-disable-line import/no-unresolved
const http = require('k6/http'); // eslint-disable-line import/no-unresolved
// const { Rate } = require('k6/metrics'); // eslint-disable-line import/no-unresolved
const { launcher } = require('k6/x/browser'); // eslint-disable-line import/no-unresolved

const {
  GEN3_HOST,
  RELEASE_VERSION,
  VU_COUNT,
  DURATION,
  ACCESS_TOKEN,
} = __ENV; // eslint-disable-line no-undef

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
  const VIEWER_STUDY_URLS = [];
  const DICOM_SERVER_URL = `https://${GEN3_HOST}/dicom-server`;
  const DICOM_VIEWER_URL = `https://${GEN3_HOST}/dicom-viewer/viewer`;
  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
  };
  const resp = http.get(`${DICOM_SERVER_URL}/studies`, params);
  console.dir(resp);
  const studies = JSON.parse(resp.body);
  // console.log(studies);
  let studyUrl = '';
  studies.forEach((study) => {
    // console.log(study);
    studyUrl = `${DICOM_SERVER_URL}/studies/${study}`;
    const res = JSON.parse(http.get(studyUrl, params).body);
    // console.log(studyUrl);
    const studyInstanceUid = res.MainDicomTags.StudyInstanceUID;
    // console.log(studyInstanceUid);
    const viewerStudyUrl = `${DICOM_VIEWER_URL}/${studyInstanceUid}`;
    // console.log(viewerStudyUrl);
    VIEWER_STUDY_URLS.push(viewerStudyUrl);
  });
  console.log(VIEWER_STUDY_URLS);
  return VIEWER_STUDY_URLS;
}

export default function (data) {
  console.log('Running scenario...');
  const url = data[Math.floor(Math.random() * data.length)];
  const browser = launcher.launch('chromium', { headless: true });
  const context = browser.newContext();
  const page = context.newPage();
  page.goto(url);
  page.screenshot({ path: `${url.split('/')[5]}` });
  page.close();
  browser.close();
  sleep(0.1);
}

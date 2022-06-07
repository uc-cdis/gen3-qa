// const { Rate } = require('k6/metrics'); // eslint-disable-line import/no-unresolved
import http from 'k6/http'; // eslint-disable-line import/no-unresolved
import launcher from 'k6/x/browser'; // eslint-disable-line import/no-unresolved
import { readFileSync } from 'fs';

// const { sleep } = require('k6'); // eslint-disable-line import/no-unresolved

const {
  GEN3_HOST,
  RELEASE_VERSION,
  VU_COUNT,
  DURATION,
  // ACCESS_TOKEN,
} = __ENV; // eslint-disable-line no-undef

console.log('Running scenario - dicom-server-metadata');
export const options = {
  tags: {
    scenario: 'Dicom Viewer - Study',
    release: RELEASE_VERSION,
    test_run_id: (new Date()).toISOString().slice(0, 16),
  },
  stages: [
    { duration: '1s', target: VU_COUNT },
    { duration: `${DURATION}s`, target: VU_COUNT },
    { duration: '1s', target: 0 },
  ],
  noConnectionReuse: true,
};

export function setup() {
  console.log('Setting up...');
  const VIEWER_STUDY_URLS = [];
  const text = readFileSync('./studies.txt').toString('utf-8');
  VIEWER_STUDY_URLS.push(text.split('\n'));
  // const DICOM_SERVER_URL = `https://${GEN3_HOST}/dicom-server`;
  const DICOM_VIEWER_URL = `https://${GEN3_HOST}/dicom-viewer/viewer`;
  /* const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
  }; */
  /* const resp = http.get(`${DICOM_SERVER_URL}/studies`, params);
  console.log(resp);
  console.log(JSON.stringify(resp.body));
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
  console.log(VIEWER_STUDY_URLS); */
  return VIEWER_STUDY_URLS;
}

export default function (data) {
  console.log('Running scenario...');
  const url = data[Math.floor(Math.random() * data.length)];
  const browser = launcher.launch('chromium', { headless: true });
  const context = browser.newContext();
  context.setDefaultTimeout(120000);
  const page = context.newPage();
  // Url of the study used in the scenario
  console.log(`*** ${url} ***`);
  page.goto(url);
  // Wait for the progess bar on the first series to reach 100%
  page.waitForSelector('//div[@class="study-browser"]//div[@class="ImageThumbnail"][1]//div[@class="image-thumbnail-progress-bar"]/div[@class="image-thumbnail-progress-bar-inner"][contains(@style, "width: 100%;")]');
  // page.screenshot({ path: `./screenshots/${url.split('/')[5]}.png` });
  page.close();
  browser.close();
}

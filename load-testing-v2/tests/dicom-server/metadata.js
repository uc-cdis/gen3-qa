/* eslint-disable no-mixed-operators */
/* eslint-disable no-bitwise */
/* eslint-disable one-var */

import { sleep, group, check } from 'k6';
import http from 'k6/http';
import { Rate } from 'k6/metrics';
import { getCommonVariables } from '../../utils/helpers.js';
const myFailRate = new Rate('failed_requests');
const credentials = JSON.parse(open('../../utils/credentials.json'));
console.log(`credentials.key_id: ${credentials.key_id}`);

//Default values:
__ENV.VU_COUNT = __ENV.VU_COUNT || "1";
__ENV.DURATION = __ENV.DURATION || "5";
__ENV.RELEASE_VERSION = __ENV.RELEASE_VERSION || "v3.3.1";
__ENV.VIRTUAL_USERS = __ENV.VIRTUAL_USERS || JSON.stringify([
    { duration: '30s', target: __ENV.VU_COUNT },
    { duration: `${__ENV.DURATION}s`, target: __ENV.VU_COUNT },
    { duration: '30s', target: 0 },
  ]);
console.log(`VIRTUAL_USERS: ${__ENV.VIRTUAL_USERS}`);

export const options = {
  tags: {
    scenario: 'Dicom Server - Metadata',
    release: __ENV.RELEASE_VERSION,
    test_run_id: (new Date()).toISOString().slice(0, 16),
  },
  stages: JSON.parse(__ENV.VIRTUAL_USERS),
  noConnectionReuse: true,
};

export function setup() {
  console.log('Setting up...');
  const METADATA_URLS = [];

  let env = getCommonVariables(__ENV, credentials);
  
  const DICOM_SERVER_URL = `${env.GEN3_HOST}/dicom-server`;
  const response = http.get(`${DICOM_SERVER_URL}/studies`, { Authorization: `Bearer ${env.ACCESS_TOKEN}` });
  console.log(`Response: ${response.status}`);
  console.log(`body: ${response.body}`);
  const studies = JSON.parse(response.body);
  console.log(`studies: ${studies}`);
  console.log(`studies type: ${typeof studies}`);

  let studyUrl = '';
  studies.forEach((study) => {
    // console.log(study);
    studyUrl = `${DICOM_SERVER_URL}/studies/${study}`;
    const res = JSON.parse(http.get(studyUrl, { Authorization: `Bearer ${env.ACCESS_TOKEN}` }).body);
    // console.log(studyUrl);
    const studyInstanceUid = res.MainDicomTags.StudyInstanceUID;
    // console.log(studyInstanceUid);
    const seriesIds = res.Series;
    // console.log(seriesIds);
    seriesIds.forEach((seriesId) => {
      // console.log(seriesId);
      const seriesUrl = `${DICOM_SERVER_URL}/series/${seriesId}`;
      const seriesInstanceUid = JSON.parse(http.get(seriesUrl, { Authorization: `Bearer ${env.ACCESS_TOKEN}` }).body).MainDicomTags.SeriesInstanceUID;
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

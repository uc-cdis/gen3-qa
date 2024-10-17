/* eslint-disable no-mixed-operators */
/* eslint-disable no-bitwise */
/* eslint-disable one-var */

import { sleep, group, check } from 'k6';
import http from 'k6/http';
import { Rate } from 'k6/metrics';
import { getCommonVariables, uuidv4 }from '../../utils/helpers.js';
const myFailRate = new Rate('failed_requests');

const credentials = JSON.parse(open('../../utils/credentials.json'));
console.log(`credentials.key_id: ${credentials.key_id}`);

//Default values:
__ENV.RELEASE_VERSION = __ENV.RELEASE_VERSION || "v3.3.1";
__ENV.VIRTUAL_USERS = __ENV.VIRTUAL_USERS || JSON.stringify([
    { "duration": "1s", "target": 1 },
    // { "duration": "5s", "target": 5 },
    // { "duration": "300s", "target": 10 }
  ]);
console.log(`VIRTUAL_USERS: ${__ENV.VIRTUAL_USERS}`);

export const options = {
  tags: {
    test_scenario: 'Sheepdog - Import clinical metadata',
    release: __ENV.RELEASE_VERSION,
    test_run_id: (new Date()).toISOString().slice(0, 16),
  },
  stages: JSON.parse(__ENV.VIRTUAL_USERS),
  thresholds: {
    http_req_duration: ['avg<3000', 'p(95)<15000'],
    'failed_requests': ['rate<0.1'],
  },
  noConnectionReuse: true,
};

export function setup() {
  return getCommonVariables(__ENV, credentials);
}

export default function (env) {
  //console.log(`RUNNING TEST~~~~~~~~~~~~~~~~~~~~~RUNNING TEST~~~~~~~~~~~~~~~~~~~~~RUNNING TEST`);
  const program = 'DEV';
  const project = 'test';
  const url = `${env.GEN3_HOST}/api/v0/submission/${program}/${project}/`;
  console.log(`sending req to: ${url}`);
  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.ACCESS_TOKEN}`,
    },
    tags: { name: 'Sheepdog-data-submission' },
  };
  const body = {
    "imp_bstrong_followup": 1.0,
    "imp_bstrong_econ": 18.972550438065916,
    "imp_bstrong_if": 2.1908063856610926,
    "imp_bstrong_inter": 39.87831384501095,
    "imp_bstrong_moud": 67.35733826943445,
    "imp_bstrong_pop": 54.99064265506012,
    "imp_bstrong_sample": 52.65013590584644,
    "imp_bstrong_sd": 46.47637683818543,
    "imp_bstrong_setting": 69.08650226868886,
    "imp_bup_econ": 14.568262512796448,
    "imp_bup_followup": 15.264297492221123,
    "imp_bup_if": 65.21745622452741,
    "imp_bup_inter": 57.482696951394175,
    "imp_bup_moud": 42.37511555274052,
    "imp_bup_pop": 21.473542634598864,
    "imp_bup_sample": 60.482730342390965,
    "imp_bup_sd": 71.82843303561289,
    "imp_bup_setting": 72.77178229286051,
    "imp_champ_econ": 33.23402064918612,
    "imp_champ_followup": 22.529734926553825,
    "imp_champ_if": 73.54648591727009,
    "imp_champ_inter": 62.695638353152376,
    "imp_champ_moud": 11.266060944212143,
    "imp_champ_pop": 33.6839387974473,
    "imp_champ_sample": 56.56313012074826,
    "imp_champ_sd": 29.293171779880822,
    "imp_champ_setting": 37.6624372988888,
    "imp_eng_econ": 51.44371419545237,
    "imp_eng_followup": 54.76852233138775,
    "imp_eng_if": 24.084413950039597,
    "imp_eng_inter": 21.066646056302506,
    "imp_eng_moud": 47.537539609849645,
    "imp_eng_pop": 47.185411433526504,
    "imp_eng_sample": 98.11000203522781,
    "imp_eng_sd": 37.05186681848341,
    "imp_eng_setting": 93.51289921204986,
    "imp_hope_econ": 75.64635351747894,
    "imp_hope_followup": 79.95784477199294,
    "imp_hope_if": 67.28348584649493,
    "imp_hope_inter": 51.1938695480554,
    "imp_hope_moud": 81.8075373637001,
    "imp_hope_pop": 89.56762679688146,
    "imp_hope_sample": 3.47359150529698,
    "imp_hope_sd": 6.763424177424449,
    "imp_hope_setting": 76.65753073902627,
    "imp_jh_econ": 13.59553733134854,
    "imp_jh_followup": 4.90538753057439,
    "imp_jh_if": 27.562589540713546,
    "imp_jh_inter": 16.90032268371623,
    "imp_jh_moud": 23.03595611721193,
    "imp_jh_pop": 18.920364811374913,
    "imp_jh_sample": 52.080298508062896,
    "imp_jh_sd": 24.532780476216665,
    "imp_jh_setting": 29.816060008633116,
    "imp_jh_studysite": null,
    "imp_me_studyname": null,
    "imp_nm_studyname": null,
    "imp_ret_econ": 18.88665436871937,
    "imp_ret_followup": 44.8133656114007,
    "imp_ret_if": 93.18506027513145,
    "imp_ret_inter": 13.083035017390687,
    "imp_ret_moud": 84.21141235123521,
    "imp_ret_pop": 66.35144953948475,
    "imp_ret_sample": 48.05111783513277,
    "imp_ret_sd": 21.16942857494116,
    "imp_ret_setting": 50.140538905417706,
    "imp_rutgers_econ": 63.56669640465905,
    "imp_rutgers_followup": 10.094737943774456,
    "imp_rutgers_if": 66.31315241344237,
    "imp_rutgers_inter": 7.732157095172032,
    "imp_rutgers_moud": 39.795590527703716,
    "imp_rutgers_pop": 87.33955967263317,
    "imp_rutgers_sample": 8.737958898127129,
    "imp_rutgers_sd": 14.121866815626483,
    "imp_rutgers_setting": 61.91799201353807,
    "imp_rutgers_studysite": null,
    "imp_scpowr_econ": 14.525903010387653,
    "imp_scpowr_follow": 83.20409736177893,
    "imp_scpowr_if": 1.007959423880811,
    "imp_scpowr_inter": 96.16020767070277,
    "imp_scpowr_moud": 7.8487824604047685,
    "imp_scpowr_pop": 92.18260916759093,
    "imp_scpowr_sample": 73.79519320314155,
    "imp_scpowr_sd": 63.86545052081972,
    "imp_scpowr_setting": 18.80670207170948,
    "imp_tree_studyname": null,
    "imp_you_studyname": null,
    "impowr_ime2_econ": 28.894634496971317,
    "impowr_ime2_followup": 82.61160005764408,
    "impowr_ime2_if": 49.108913252518505,
    "impowr_ime2_inter": 49.7278393883287,
    "impowr_ime2_moud": 7.45588535756575,
    "impowr_ime2_pop": 29.848468924066097,
    "impowr_ime2_sample": 92.90201767059885,
    "impowr_ime2_sd": 54.36652949843276,
    "impowr_ime2_setting": 23.391254033433817,
    "impowr_optic_econ": 89.97275863788836,
    "impowr_optic_followup": 24.945852565306893,
    "impowr_optic_if": 4.404881480529477,
    "impowr_optic_inter": 25.518785225390282,
    "impowr_optic_moud": 75.82396244033995,
    "impowr_optic_pop": 44.1294810259977,
    "impowr_optic_sample": 11.92876233859298,
    "impowr_optic_sd": 60.772077299447744,
    "impowr_optic_setting": 26.893426432938572,
    "projects": {
      "code": "test"
    },
    project_id: `${program}-${project}`,
    '*submitter_id': uuidv4(),
    //transplanted_organ: '1671409e2e',
    //unit_geographic_site: 'a0761970f8',
    '*type': 'study',
    //cohort_id: 'Postmortem',
    //geographic_site: 'c75bf740d9', // pragma: allowlist secret
  };
  const strBody = JSON.stringify(body);
  // console.log(`debugging: ${JSON.stringify(body)}`);

  // console.log(`submitting: subject_9769d601552${__ITER}`); // eslint-disable-line no-undef

  group('Importing and exporting clinical metadata', () => {
    // TODO: Come up with a way to interrupt the load test
    // When we reach a certain number of records
    //console.log(`__ITER: ${__ITER}`); // eslint-disable-line no-undef
    // if (__ITER < NUM_OF_RECORDS) { // eslint-disable-line no-undef

    group('http put', () => {
      const res = http.put(url, strBody, params);
      // console.log(`Request performed: ${new Date()}`);
      myFailRate.add(res.status !== 200);
      if (res.status !== 200) {
        console.log(`Request response: ${res.status}`);
        console.log(`Request response: ${res.body}`);
      }
      check(res, {
        'is status 200': (r) => r.status === 200,
      });
    });
    group('wait 0.1s between requests', () => {
      sleep(0.1);
    });
    // } else {
    //   fail(`${__ITER} records created on ${GEN3_HOST}`); // eslint-disable-line no-undef
    // }
  });
}

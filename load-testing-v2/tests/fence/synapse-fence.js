/*eslint-disable*/
import { check } from 'k6';
import http from 'k6/http';

const {
  RELEASE_VERSION,
} = __ENV; // eslint-disable-line no-undef

export const options = {
  tags: {
    test_scenario: 'Fence - Synapse login',
    release: RELEASE_VERSION,
    test_run_id: (new Date()).toISOString().slice(0, 16),
  },
  // //under what conditions a test is considered as successful or not based on maetric data
  thresholds: {
    http_req_duration: ['avg<250'],
  },
  // //max no of simultaneous/parallel connections total
  batch: 15,
  // //no of virtual users
  vus: 1000,
  // //fixed number of iterations to execute the script
  // iterations: 10,
  // max no of requests to make per seconds in total across all VUs
  // rps: 20
};

export default function () {
  const url = 'https://qa.brain.planx.pla.net';
  const res = http.get(url);
  // check(res,{
  //     "is status 200": (r) => r.status == 200
  // });
}

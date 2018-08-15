'use strict';

let username = process.env.INDEX_USERNAME;
let password = process.env.INDEX_PASSWORD;
let indexAuth = Buffer.from(`${username}:${password}`).toString('base64');

module.exports = {
  validAccessTokenHeader: {
    'Accept': 'application/json',
    'Authorization': `bearer ${process.env.ACCESS_TOKEN}`
  },

  expiredAccessTokenHeader: process.env.EXPIRED_ACCESS_TOKEN,

  validIndexAuthHeader: {
    'Accept': 'application/json',
    'Content-Type': 'application/json; charset=UTF-8',
    'Authorization': `Basic ${indexAuth}`
  },

  get program() {
    let program_name = process.env.HOSTNAME.startsWith('qa') ? 'QA' : 'DEV';
    return {
      name: program_name, type: 'program',
      dbgap_accession_number: program_name
    };
  },


  project: {
    type: "project",
    code: "test",
    name: "test",
    dbgap_accession_number: "test",
    state: "open",
    releasable: true
  }
};
const guppyProps = require('./guppyProps.js');
const user = require('../../../utils/user.js');
const { Gen3Response, getCookie, getAccessTokenHeader } = require('../../../utils/apiUtil');
const { Bash, takeLastLine } = require('../../../utils/bash');

// const actor = require('codeceptjs').actor;
// const I = actor();

const { container } = require('codeceptjs');
const bash = new Bash();
const fetch = require('node-fetch');
const fs = require('fs');

/**
 * guppy Tasks
 */
module.exports = {
    async submitQueryFileToGuppy(endpoint, queryToSubmitFilename, access_token) {
      // const filePathPrefix = 'test_plans/guppy/test_data/';
      const queryFile = queryToSubmitFilename;
      let queryToSubmit = fs.readFileSync(queryFile).toString().split('\n'); 
      queryToSubmit = queryToSubmit.join('').replace(/\/t/g, '/');;
      const data = {
        method: 'POST', // or 'PUT'
        body: queryToSubmit,
        headers:{
          'Content-Type': 'application/json',
          'Authorization' : "bearer " + access_token
        }
      };

      return fetch(endpoint, data).then(function(response) {
        //console.log('response: ', response);
        return response; //.json();
      });
  },
};
const fetch = require('node-fetch');
const fs = require('fs');

/**
 * guppy Tasks
 */
module.exports = {
    async submitQueryFileToGuppy(endpoint, queryToSubmitFilename, access_token) {
      const queryFile = queryToSubmitFilename;
      let queryToSubmit = fs.readFileSync(queryFile).toString().split('\n'); 
      queryToSubmit = queryToSubmit.join('').replace(/\/t/g, '/');;
      const data = {
        method: 'POST',
        body: queryToSubmit,
        headers:{
          'Content-Type': 'application/json',
          'Authorization' : "bearer " + access_token
        }
      };

      return fetch(endpoint, data).then(function(response) {
        return response;
      });
  },
};
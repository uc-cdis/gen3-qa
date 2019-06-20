const guppyProps = require('./guppyProps.js');
const user = require('../../../utils/user.js');
const { Gen3Response, getCookie, getAccessTokenHeader } = require('../../../utils/apiUtil');
const { Bash, takeLastLine } = require('../../../utils/bash');

// const actor = require('codeceptjs').actor;
// const I = actor();

const { container } = require('codeceptjs');
const bash = new Bash();
const fetch = require('node-fetch');

// function getMethods(obj) {
//   var result = [];
//   for (var id in obj) {
//     try {
//       if (typeof(obj[id]) == "function") {
//         result.push(id + ": " + obj[id].toString());
//       }
//     } catch (err) {
//       result.push(id + ": inaccessible");
//     }
//   }
//   return result;
// }

// console.log((getMethods(container).join("\n")));

/**
 * guppy Tasks
 */
module.exports = {
  /**
   * Hits guppy's graphql endpoint
   * @param {string} id - id/did of an indexd file
   * @param {string[]} userHeader - a user's access token header
   * @returns {Promise<Gen3Response>}
   */
  submitGraphQLQuery(queryToSubmit, userHeader=user.mainAcct.accessTokenHeader) {
    const URL = guppyProps.endpoints.graphqlEndpoint;
    // console.log('bout to submit: ', queryToSubmit);
    const data = {
      method: 'POST', // or 'PUT'
      body: queryToSubmit,
      headers:{
        'Content-Type': 'application/json'
      }
    };

    return fetch(URL, data).then(function(response) {
      //console.log('response: ', response);
      return response; //.json();
    });
    
    // return I.sendGetRequest(guppyProps.endpoints.graphqlEndpoint,
    //   userHeader,
    // ).then(res => new Gen3Response(res));
  },

  // getFileFromSignedUrlRes(signedUrlRes) {
  //   if (
  //     signedUrlRes
  //     && signedUrlRes.hasOwnProperty('body')
  //     && signedUrlRes["body"] !== undefined
  //     && signedUrlRes["body"].hasOwnProperty('url')
  //   ){
  //     return I.sendGetRequest(signedUrlRes["body"].url).then(res => res.body);
  //   }
  //   console.log(FILE_FROM_URL_ERROR);
  //   return FILE_FROM_URL_ERROR;
  // },
};

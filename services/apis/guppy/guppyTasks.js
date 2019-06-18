const guppyProps = require('./guppyProps.js');
const user = require('../../../utils/user.js');
const { Gen3Response, getCookie, getAccessTokenHeader } = require('../../../utils/apiUtil');
const { Bash, takeLastLine } = require('../../../utils/bash');

const { container } = require('codeceptjs');
const bash = new Bash();

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
    return I.sendGetRequest(guppyProps.endpoints.graphqlEndpoint,
      userHeader,
    ).then(res => new Gen3Response(res));
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

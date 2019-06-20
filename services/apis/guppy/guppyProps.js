const { Gen3Response } = require('../../../utils/apiUtil');

/**
 * guppy Properties
 */

class Client {
  constructor({ envVarsName }) {
    this.envVarsName = envVarsName;
  }
  get id() {
    return process.env[`${this.envVarsName}_ID`];
  }
  get secret() {
    return process.env[`${this.envVarsName}_SECRET`];
  }
}

const namespace = process.env.NAMESPACE;
const hostname = 'https://' + namespace + '.planx-pla.net';

module.exports = {
  /**
   * Guppy endpoints
   */
  endpoints: {
    graphqlEndpoint: hostname + `/guppy/graphql`,
    downloadEndpoint: hostname + `/guppy/download`,
    hostname: hostname
  },

  /**
   * Project.auth_ids to bucket info
   */
  googleBucketInfo: {
    QA: {
       googleProjectId: 'dcf-integration',
       bucketId: 'dcf-integration-qa',
       fileName: 'file.txt',
       fileContents: 'dcf-integration-qa'
    },
    test: {
       googleProjectId: 'dcf-integration',
       bucketId: 'dcf-integration-test',
       fileName: 'file.txt',
       fileContents: 'dcf-integration-test'
    }
  },

  resExpiredAccessToken: new Gen3Response({
    guppyError: 'Authentication Error: Signature has expired',
    statusCode: 401,
  }),
  
};

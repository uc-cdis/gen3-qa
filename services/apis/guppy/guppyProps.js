const { Gen3Response } = require('../../../utils/apiUtil');

/**
 * guppy Properties
 */
const rootEndpoint = '/guppy';

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

module.exports = {
  /**
   * Guppy endpoints
   */
  endpoints: {
    root: rootEndpoint,
    graphqlEndpoint: `${rootEndpoint}/guppy/graphql`,
    downloadEndpoint: `${rootEndpoint}/guppy/download`,
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

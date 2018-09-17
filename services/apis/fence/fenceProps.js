const { Gen3Response } = require('../../../utils/apiUtil');

/**
 * fence Properties
 */
const rootEndpoint = '/user';
module.exports = {
  /**
   * Fence endpoints
   */
  endpoints: {
    root: rootEndpoint,
    getFile: `${rootEndpoint}/data/download`,
    createAPIKey: `${rootEndpoint}/credentials/api/`,
    deleteAPIKey: `${rootEndpoint}/credentials/api/cdis`,
    getAccessToken: `${rootEndpoint}/credentials/api/access_token`,
    linkGoogle: `${rootEndpoint}/link/google?redirect=.`,
    deleteGoogleLink: `${rootEndpoint}/link/google`,
    extendGoogleLink: `${rootEndpoint}/link/google`,
    registerGoogleServiceAccount: `${rootEndpoint}/google/service_accounts/`,
  },

  /**
   * Google project and group properties
   */
  googleGroupKey: 'dcf-integration-qa_read_gbag@planx-pla.net',
  googleProjectAID: 'projecta-215714',

  errorLinkedToAnotherAcct: {
    error: 'g_acnt_link_error',
    error_description: 'Could not link Google account. The account specified is already linked to a different user.',
  },

  linkExtendAmount: 86400, // 24 hours (in seconds)

  /**
   * Create Access Token Responses
   */
  resExpiredAccessToken: new Gen3Response({
    fenceError: 'Authentication Error: Signature has expired',
    statusCode: 401,
  }),

  resInvalidAPIKey: new Gen3Response({
    fenceError: 'Not enough segments',
    statusCode: 401,
  }),

  resMissingAPIKey: new Gen3Response({
    fenceError: 'Please provide an api_key in payload',
    statusCode: 400,
  }),

  /**
   * Presigned URL responses
   */
  resMissingFilePermission: new Gen3Response({
    fenceError: "You don't have access permission on this file",
    statusCode: 401,
  }),

  resInvalidFileProtocol: new Gen3Response({
    fenceError: 'The specified protocol s2 is not supported',
    statusCode: 400,
  }),

  resNoFileProtocol: new Gen3Response({
    fenceError: "Can't find any file locations.",
    statusCode: 404,
  }),

  /**
   * Link Google responses
   */
  resUnlinkSuccess: new Gen3Response({ statusCode: 200 }),

  resExtendNoGoogleAcctLinked: new Gen3Response({
    fenceError: 'User does not have a linked Google account.',
    statusCode: 404,
  }),

  resUnlinkNoGoogleAcctLinked: new Gen3Response({
    body: {
      error: 'g_acnt_link_error',
      error_description: "Couldn't unlink account for user, no linked Google account found.",
    },
    statusCode: 404,
  }),

  /**
   * Google login page elements
   */
  googleLogin: {
    readyCue: {
      locator: {
        text: 'Sign in with Google',
      },
    },
    emailField: {
      locator: {
        css: '#identifierId',
      },
    },
    emailNext: {
      locator: {
        css: '#identifierNext',
      },
    },
    passwordField: {
      locator: {
        css: 'input[type="password"]',
      },
    },
    passwordNext: {
      locator: {
        css: '#passwordNext',
      },
    },
    useAnotherAcctBtn: {
      locator: {
        xpath: '//div[contains(text(), \'Use another account\')]',
      },
    },
  },

  /**
   * Google Projects
   */
  googleProjectA: {
    id: 'projecta-215714',
    serviceAccountEmail: 'projaserviceacct@projecta-215714.iam.gserviceaccount.com',
    linkedToFence: true,
    hasParentOrganization: false,
  },
};

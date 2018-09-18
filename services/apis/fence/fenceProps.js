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
    registerGoogleServiceAccount: `${rootEndpoint}/google/service_accounts`,
    deleteGoogleServiceAccount: `${rootEndpoint}/google/service_accounts`,
    getGoogleServiceAccounts: `${rootEndpoint}/google/service_accounts`,
    getGoogleServiceAccountMonitor: `${rootEndpoint}/google/service_accounts/monitor`,
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
   * Google Service Account responses
   */
  resRegisterServiceAccountSuccess: new Gen3Response({ statusCode: 200 }),

  resDeleteServiceAccountSuccess: new Gen3Response({ statusCode: 200 }),

  resRegisterServiceAccountNotLinked: new Gen3Response({
    statusCode: 400,
    body: {
      errors: {
        google_project_id: {
          status: 403,
          service_account_validity: {},
          error_description: 'Current user is not an authorized member on the provided Google Project.',
          membership_validity: {},
          error: 'unauthorized_user',
        },
      },
      success: false,
    },
  }),

  resRegisterServiceAccountHasParentOrg: new Gen3Response({
    statusCode: 400,
    body: {
      errors: {
        google_project_id: {
          status: 403,
          service_account_validity: {},
          error_description: 'Project has parent organization. ',
          membership_validity: {
            members_exist_in_fence: true,
            valid_member_types: true,
          },
          error: 'unauthorized',
        },
      },
      success: false,
    },
  }),

  resRegisterServiceAccountFenceNoAccess: new Gen3Response({
    statusCode: 400,
    body: {
      errors: {
        google_project_id: {
          status: 404,
          service_account_validity: {},
          error_description: "Fence's monitoring service account does not have access to the project.",
          membership_validity: {},
          error: 'monitor_not_found',
        },
      },
      success: false,
    },
  }),

  resRegisterServiceAccountInvalidServiceAcct: new Gen3Response({
    statusCode: 400,
    body: {
      errors: {
        service_account_email: {
          status: 403,
          error_description: 'Service account requested for registration is invalid.',
          error: 'unauthorized',
        },
      },
      success: false,
    },
  }),

  resRegisterServiceAccountInvalidProject: new Gen3Response({
    statusCode: 400,
    body: {
      errors: {
        project_access: {
          status: 404,
          error_description: 'A project requested for access could not be found by the given identifier. ',
          error: 'project_not_found',
        },
      },
      success: false,
    },
  }),

  resRegisterServiceAccountMissingProjectPrivilege: new Gen3Response({
    statusCode: 400,
    body: {
      errors: {
        project_access: {
          status: 403,
          error_description: 'Not all users have necessary access to project(s). ',
          error: 'unauthorized',
        },
      },
      success: false,
    },
  }),

  /**
   * Google Projects
   */
  googleProjectA: {
    id: 'simpleprojectalpha',
    serviceAccountEmail: 'serviceaccount@simpleprojectalpha.iam.gserviceaccount.com',
    linkedToFence: true,
    hasParentOrganization: false,
    owner: 'gen3.autotest@gmail.com',
    computeServiceAccountEmail: '264606384811-compute@developer.gserviceaccount.com',
  },

  googleProjectWithParentOrg: {
    id: 'planxparentproject',
    serviceAccountEmail: 'serviceaccount@planxparentproject.iam.gserviceaccount.com',
    linkedToFence: true,
    hasParentOrganization: true,
    owner: 'dummy-one@planx-pla.net',
  },

  googleProjectFenceNotRegistered: {
    id: 'projectfencenoaccess',
    serviceAccountEmail: 'serviceaccount@projectfencenoaccess.iam.gserviceaccount.com',
    linkedToFence: false,
    hasParentOrganization: false,
    owner: 'gen3.autotest@gmail.com',
  },

  googleProjectServiceAcctHasKey: {
    id: 'projectserviceaccthaskey',
    serviceAccountEmail: 'serviceaccount@projectserviceaccthaskey.iam.gserviceaccount.com',
    linkedToFence: true,
    hasParentOrganization: true,
    owner: 'gen3.autotest@gmail.com',
  },
};

const { Gen3Response } = require('../../../utils/apiUtil');

/**
 * fence Properties
 */
const rootEndpoint = '/user';

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
   * Fence endpoints
   */
  endpoints: {
    root: rootEndpoint,
    getFile: `${rootEndpoint}/data/download`,
    googleCredentials: `${rootEndpoint}/credentials/google/`,
    createAPIKey: `${rootEndpoint}/credentials/api/`,
    deleteAPIKey: `${rootEndpoint}/credentials/api/cdis`,
    getAccessToken: `${rootEndpoint}/credentials/api/access_token`,
    linkGoogle: `${rootEndpoint}/link/google?redirect=.`,
    deleteGoogleLink: `${rootEndpoint}/link/google`,
    extendGoogleLink: `${rootEndpoint}/link/google`,
    registerGoogleServiceAccount: `${rootEndpoint}/google/service_accounts`,
    deleteGoogleServiceAccount: `${rootEndpoint}/google/service_accounts`,
    getGoogleServiceAccounts: `${rootEndpoint}/google/service_accounts`,
    authorizeOAuth2Client: `${rootEndpoint}/oauth2/authorize`,
    tokenOAuth2Client: `${rootEndpoint}/oauth2/token`,
    userEndPoint: `${rootEndpoint}/user`,
    adminEndPoint: `${rootEndpoint}/admin`,
    uploadFile: `${rootEndpoint}/data/upload`,
    deleteFile: `${rootEndpoint}/data`,
  },

  monitorServiceAccount: 'fence-service@dcf-integration.iam.gserviceaccount.com',

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

  /**
   * AWS bucket info
   */
   awsBucketInfo: {
      cdis_presigned_url_test: {
        testdata: 'Hi Zac!\ncdis-data-client uploaded this!\n'
      }
   },

  /**
   * Google group for testing
   */
  googleGroupTestEmail: 'gen3-autoqa@googlegroups.com',

  /**
   * Link google account duration
   */
  linkExtendDefaultAmount: 86400, // 24 hours (in seconds)

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

  resUserAlreadyLinked: 'error_description=User+already+has+a+linked+Google+account.&error=g_acnt_link_error',

  resAccountAlreadyLinked: 'error_description=Could+not+link+Google+account.+The+account+specified+is+already+linked+to+a+different+user.&error=g_acnt_link_error',

  /**
   * Consent page
   */
  consentPage: {
    readyCue: {
      locator: {
        text: 'Gen3 Data Commons',
      },
    },
    cancelBtn: {
      locator: {
        xpath: '//button[contains(text(), \'Cancel\')]',
      },
    },
    consentBtn: {
      locator: {
        xpath: '//button[contains(text(), \'Yes, I authorize.\')]',
      },
    },
  },

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

  resRegisterServiceAccountInvalidMemberType: new Gen3Response({
    statusCode: 400,
    body: {
      errors: {
        google_project_id: {
          status: 403,
          membership_validity: {
            valid_member_types: false,
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
          status: 403
        },
      },
      success: false,
    },
  }),

  resRegisterServiceAccountInaccessibleServiceAcct: new Gen3Response({
    statusCode: 400,
    body: {
      errors: {
        service_account_email: {
          status: 404
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
          error: 'project_not_found',
        },
      },
      success: false,
    },
  }),

  resRegisterServiceAccountWrongProject: new Gen3Response({
    statusCode: 400,
    body: {
      errors: {
        service_account_email: {
          status: 404,
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
          error: 'unauthorized',
        },
      },
      success: false,
    },
  }),

  resDeleteServiceAccountWhenNotLinked: new Gen3Response({ statusCode: 403 }),

  resDeleteServiceAccountNotRegistered: new Gen3Response({
    statusCode: 404,
    fenceError: 'Could not find a registered service account from given email',
  }),

  /**
   * Expected reasons for an invalid SA/Google project in the
   * google-manage-user-registrations job logs
   */
  monitorSAJobLog: {
    noFenceUser: 'INVALID user(s) do not exist in fence',
    noDataAccess: 'does not have access to project',
    externalAccess: 'it has external access (keys generated or roles on it)',
  },

  /**
   * Google Projects
   */
  googleProjectA: {
    // -fence SA in project:                  true
    // -has a parent organization:            false
    // -has service acct with invalid type:   false
    // -has a service acct with key:          false
    id: 'simpleprojectalpha',
    serviceAccountEmail: 'serviceaccount@simpleprojectalpha.iam.gserviceaccount.com',
    defaultIsValidGCP: true,
    owner: 'gen3.autotest@gmail.com',
  },

  // Used when the tests need to modify the google project itself.
  // Note: the id and email are updated during test_setup depending
  // on the current namespace
  googleProjectDynamic: {
    // -fence SA in project:                  true
    // -has a parent organization:            false
    // -has service acct with invalid type:   false
    // -has a service acct with key:          false
    id: 'gen3qa-NAMESPACE',
    // id: 'gen3qa-validationjobtest',
    serviceAccountEmail: 'service-account@gen3qa-NAMESPACE.iam.gserviceaccount.com',
    defaultIsValidGCP: true,
    owner: 'gen3.autotest@gmail.com',
  },

  googleProjectWithComputeServiceAcct: {
    // -fence SA in project:                  true
    // -has a parent organization:            false
    // -has service acct with invalid type:   false
    // -has a service acct with key:          false
    id: 'projectwithcomputeapi',
    serviceAccountEmail: '796412374583-compute@developer.gserviceaccount.com',
    defaultIsValidGCP: true,
    owner: 'gen3.autotest@gmail.com',
  },

  googleProjectWithInvalidServiceAcct: {
    // -fence SA in project:                  true
    // -has a parent organization:            false
    // -has service acct with invalid type:   true - default cause of failure
    // -has a service acct with key:          false
    id: 'projectwithcomputeapi',
    serviceAccountEmail: '796412374583@cloudservices.gserviceaccount.com',
    defaultIsValidGCP: false,
    owner: 'gen3.autotest@gmail.com',
  },

  googleProjectWithParentOrg: {
    // -fence SA in project:                  true
    // -has a parent organization:            true - default cause of failure
    // -has service acct with invalid type:   false
    // -has a service acct with key:          false
    id: 'planxparentproject',
    serviceAccountEmail: 'serviceaccount@planxparentproject.iam.gserviceaccount.com',
    defaultIsValidGCP: false,
    owner: 'dummy-one@planx-pla.net',
  },

  googleProjectFenceNotRegistered: {
    // -fence SA in project:                  false - default cause of failure
    // -has a parent organization:            false
    // -has service acct with invalid type:   false
    // -has a service acct with key:          false
    id: 'projectfencenoaccess',
    serviceAccountEmail: 'serviceaccount@projectfencenoaccess.iam.gserviceaccount.com',
    defaultIsValidGCP: false,
    owner: 'gen3.autotest@gmail.com',
  },

  googleProjectServiceAcctHasKey: {
    // -fence SA in project:                  true
    // -has a parent organization:            false
    // -has service acct with invalid type:   false
    // -has a service acct with key:          true - default cause of failure
    id: 'projectserviceaccthaskey',
    serviceAccountEmail: 'serviceaccount@projectserviceaccthaskey.iam.gserviceaccount.com',
    defaultIsValidGCP: false,
    owner: 'gen3.autotest@gmail.com',
  },

  /*
  Clients are expected to have the following authZ policies:

  client/CLIENT has both abc-admin and gen3-admin
  abcClient/ABC_CLIENT has abc-admin
  */
  clients: {
    client: new Client({
      envVarsName: 'CLIENT',
    }),
    abcClient: new Client({
      envVarsName: 'ABC_CLIENT',
    }),
    clientImplicit: new Client({
      envVarsName: 'CLIENTB',
    }),
  },
};

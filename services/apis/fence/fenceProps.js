const { Gen3Response } = require('../../../utils/apiUtil');
const { Bash, takeLastLine } = require('../../../utils/bash');

const bash = new Bash();

/**
 * fence Properties
 */
const rootEndpoint = '/user';

/**
 * Runs a fence command for creating a client
 * @param {string} clientName - client name
 * @param {string} userName - user name
 * @param {string} clientType - client type (implicit or basic)
 * @param {string} arboristPolicies - space-delimited list of arborist policies to give to client
 * @returns {json}
 */
function createClient(clientName, userName, clientType, expires_in, arboristPolicies = null) {
  let fenceCmd = 'fence-create';

  // see test_setup.js for the ARBORIST_... global flag setup
  if (arboristPolicies && process.env.ARBORIST_CLIENT_POLICIES) {
    fenceCmd = `${fenceCmd} --arborist http://arborist-service/`;
  }

  if (clientType === 'client_credentials') {
    fenceCmd = `${fenceCmd} client-create --client ${clientName} --grant-types client_credentials`;
  } else if (clientType === 'implicit') {
    fenceCmd = `${fenceCmd} client-create --client ${clientName} --user ${userName} --urls https://${process.env.HOSTNAME} --grant-types implicit --public`;
  } else {
    fenceCmd = `${fenceCmd} client-create --client ${clientName} --user ${userName} --urls https://${process.env.HOSTNAME}`;
  }

  if (arboristPolicies && process.env.ARBORIST_CLIENT_POLICIES) {
    fenceCmd = `${fenceCmd} --policies ${arboristPolicies}`;
  }

  if (expires_in) {
    fenceCmd = `${fenceCmd} --expires-in ${expires_in}`;
  }

  console.log(`running: ${fenceCmd}`);
  const resCmd = bash.runCommand(fenceCmd, 'fence', takeLastLine);
  const arr = resCmd.replace(/[()']/g, '').split(',').map((val) => val.trim());
  return { client_id: arr[0], client_secret: arr[1] };
}

/**
 * Runs a fence command for delete a client
 * @param {string} clientName - client name
 */
function deleteClient(clientName) {
  const deleteClientCmd = `fence-create client-delete --client ${clientName}`;
  const deleteClientReq = bash.runCommand(deleteClientCmd, 'fence', takeLastLine);
  console.log(`Client deleted : ${deleteClientReq}`);
}

/**
 * Lazy-load container for fence clients
 */
class Client {
  constructor({
    clientName, userName, clientType, arboristPolicies, expires_in,
  }) {
    this.clientName = clientName;
    this.userName = userName;
    this.clientType = clientType;
    this.arboristPolicies = arboristPolicies;
    this.expires_in = expires_in;
    this._client = null;
  }

  // deleteClient = fenceTasks.deleteClient;
  // createClient = fenceTasks.createClient;

  get client() {
    if (!this._client) {
      deleteClient(this.clientName);
      this._client = createClient(
        this.clientName,
        this.userName,
        this.clientType,
        this.expires_in,
        this.arboristPolicies,
      );
    }
    return { ...this._client };
  }

  get id() {
    return this.client.client_id;
  }

  get secret() {
    return this.client.client_secret;
  }
}

module.exports = {
  /**
   * Fence endpoints
   */
  Client,
  endpoints: {
    root: rootEndpoint,
    version: `${rootEndpoint}/_version`,
    getFile: `${rootEndpoint}/data/download`,
    googleCredentials: `${rootEndpoint}/credentials/google/`,
    createAPIKey: `${rootEndpoint}/credentials/api/`,
    deleteAPIKey: `${rootEndpoint}/credentials/api/cdis`,
    getAccessToken: `${rootEndpoint}/credentials/api/access_token`,
    linkGoogle: `${rootEndpoint}/link/google?redirect=/login`,
    deleteGoogleLink: `${rootEndpoint}/link/google`,
    extendGoogleLink: `${rootEndpoint}/link/google`,
    registerGoogleServiceAccount: `${rootEndpoint}/google/service_accounts`,
    updateGoogleServiceAccount: `${rootEndpoint}/google/service_accounts`,
    deleteGoogleServiceAccount: `${rootEndpoint}/google/service_accounts`,
    getGoogleServiceAccounts: `${rootEndpoint}/google/service_accounts`,
    getGoogleSvcAcctMonitor: `${rootEndpoint}/google/service_accounts/monitor`,
    getGoogleBillingProjects: `${rootEndpoint}/google/billing_projects`,
    authorizeOAuth2Client: `${rootEndpoint}/oauth2/authorize`,
    tokenOAuth2Client: `${rootEndpoint}/oauth2/token`,
    publicKeysEndpoint: `${rootEndpoint}/jwt/keys`,
    userEndPoint: `${rootEndpoint}/user`,
    adminEndPoint: `${rootEndpoint}/admin`,
    uploadFile: `${rootEndpoint}/data/upload`,
    deleteFile: `${rootEndpoint}/data`,
    multipartUploadInit: `${rootEndpoint}/data/multipart/init`,
    multipartUpload: `${rootEndpoint}/data/multipart/upload`,
    multipartUploadComplete: `${rootEndpoint}/data/multipart/complete`,
  },

  monitorServiceAccount: 'fence-service@dcf-integration.iam.gserviceaccount.com',

  FILE_FROM_URL_ERROR: 'Could not get file contents from signed url response',

  /**
   * Project.auth_ids to bucket info
   */
  googleBucketInfo: {
    QA: {
      googleProjectId: 'dcf-integration',
      bucketId: 'dcf-integration-qa',
      fileName: 'file.txt',
      fileContents: 'dcf-integration-qa',
    },
    test: {
      googleProjectId: 'dcf-integration',
      bucketId: 'dcf-integration-test',
      fileName: 'file.txt',
      fileContents: 'dcf-integration-test',
    },
  },

  /**
   * AWS bucket info
   */
  awsBucketInfo: {
    cdis_presigned_url_test: {
      testdata: 'Hi Zac!\ncdis-data-client uploaded this!\n',
    },
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
    request: {},
    fenceError: 'Authentication Error: Signature has expired',
    status: 401,
  }),

  resInvalidAPIKey: new Gen3Response({
    request: {},
    fenceError: 'Not enough segments',
    status: 401,
  }),

  resMissingAPIKey: new Gen3Response({
    request: {},
    fenceError: 'Please provide an api_key in payload',
    status: 400,
  }),

  /**
   * Presigned URL responses
   */
  resMissingFilePermission: new Gen3Response({
    request: {},
    fenceError: 'You don\'t have access permission on this file',
    status: 401,
  }),

  resInvalidFileProtocol: new Gen3Response({
    request: {},
    fenceError: 'The specified protocol s2 is not supported',
    status: 400,
  }),

  resNoFileProtocol: new Gen3Response({
    request: {},
    fenceError: 'Can\'t find any file locations.',
    status: 404,
  }),

  /**
   * Link Google responses
   */
  resUnlinkSuccess: new Gen3Response({ request: {}, status: 200 }),

  resExtendNoGoogleAcctLinked: new Gen3Response({
    request: {},
    fenceError: 'User does not have a linked Google account.',
    status: 404,
  }),

  resUnlinkNoGoogleAcctLinked: new Gen3Response({
    request: {},
    body: {
      error: 'g_acnt_link_error',
      error_description: 'Couldn\'t unlink account for user, no linked Google account found.',
    },
    status: 404,
  }),

  resUserAlreadyLinked: 'error_description=User+already+has+a+linked+Google+account.',

  resAccountAlreadyLinked: 'error_description=Could+not+link+Google+account.+The+account+specified+is+already+linked+to+a+different+user.',

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
  resRegisterServiceAccountSuccess: new Gen3Response({ request: {}, status: 200 }),

  resDeleteServiceAccountSuccess: new Gen3Response({ request: {}, status: 200 }),

  resRegisterServiceAccountNotLinked: new Gen3Response({
    request: {},
    status: 400,
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
    request: {},
    status: 400,
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
    request: {},
    status: 400,
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
    request: {},
    status: 400,
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

  resRegisterServiceAccountInvalidServiceAcctGAPIAcct: new Gen3Response({
    request: {},
    status: 400,
    body: {
      errors: {
        service_account_email: {
          status: 404,
        },
      },
      success: false,
    },
  }),

  resRegisterServiceAccountInvalidServiceAcctWithKey: new Gen3Response({
    request: {},
    status: 400,
    body: {
      errors: {
        service_account_email: {
          status: 403,
        },
      },
      success: false,
    },
  }),

  resRegisterServiceAccountInaccessibleServiceAcct: new Gen3Response({
    request: {},
    status: 400,
    body: {
      errors: {
        service_account_email: {
          status: 404,
        },
      },
      success: false,
    },
  }),

  resRegisterServiceAccountInvalidProject: new Gen3Response({
    request: {},
    status: 400,
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
    request: {},
    status: 400,
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
    request: {},
    status: 400,
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

  resDeleteServiceAccountWhenNotLinked: new Gen3Response({ request: {}, status: 403 }),

  resDeleteServiceAccountNotRegistered: new Gen3Response({
    request: {},
    status: 404,
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
    id: process.env.GCLOUD_DYNAMIC_PROJECT !== undefined ? process.env.GCLOUD_DYNAMIC_PROJECT : 'gen3qa-NAMESPACE',
    // id: 'gen3qa-validationjobtest',
    serviceAccountEmail: process.env.GCLOUD_DYNAMIC_PROJECT !== undefined ? `service-account@${process.env.GCLOUD_DYNAMIC_PROJECT}.iam.gserviceaccount.com` : 'service-account@gen3qa-NAMESPACE.iam.gserviceaccount.com',
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
      clientName: 'basic-test-client',
      userName: 'test-client@example.com',
      clientType: 'basic',
      arboristPolicies: 'abc-admin gen3-admin',
    }),
    abcClient: new Client({
      clientName: 'basic-test-abc-client',
      userName: 'test-abc-client@example.com',
      clientType: 'basic',
      arboristPolicies: 'abc-admin',
    }),
    clientImplicit: new Client({
      clientName: 'implicit-test-client',
      userName: 'test@example.com',
      clientType: 'implicit',
      arboristPolicies: null,
    }),
  },
};

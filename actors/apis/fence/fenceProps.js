/**
 * fence Properties
 */
const rootEndpoint = '/user';
module.exports = {
  endpoints: {
    root: rootEndpoint,
    getFile: `${rootEndpoint}/data/download`,
    createAPIKey: `${rootEndpoint}/credentials/api/`,
    deleteAPIKey: `${rootEndpoint}/credentials/api/cdis`,
    getAccessToken: `${rootEndpoint}/credentials/api/access_token`,
    linkGoogle: `${rootEndpoint}/link/google?redirect=.`,
    deleteGoogleLink: `${rootEndpoint}/link/google`,
    extendGoogleLink: `${rootEndpoint}/link/google`,
  },

  linkErrors: {
    noGoogleAcctLinked: {
      statusCode: 404,
      error: 'g_acnt_link_error',
      error_description:
        "Couldn't unlink account for user, no linked Google account found.",
    },
    linkedToAnotherAcct: {
      error: 'g_acnt_link_error',
      error_description: 'Could not link Google account. The account specified is already linked to a different user.',
    },
  },

  googleLogin: {
    readyCue: {
      locator: {
        css: 'h1',
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
    passwordReadyCue: {
      locator: {
        text: 'Welcome',
      },
    },
    useAnotherAcctBtn: {
      locator: {
        xpath: '//div[contains(text(), \'Use another account\')]',
      },
    },
  },

  linkExtendAmount: 86400, // 24 hours (in seconds)
};

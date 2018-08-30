/**
 * fence Properties
 */
const root_endpoint = '/user';
module.exports = {
  endpoints: {
    root: root_endpoint,
    getFile: `${root_endpoint}/data/download`,
    createAPIKey: `${root_endpoint}/credentials/api/`,
    deleteAPIKey: `${root_endpoint}/credentials/api/cdis`,
    getAccessToken: `${root_endpoint}/credentials/api/access_token`,
    linkGoogle: `${root_endpoint}/link/google?redirect=.`,
    deleteGoogleLink: `${root_endpoint}/link/google`,
    extendGoogleLink: `${root_endpoint}/link/google`,
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

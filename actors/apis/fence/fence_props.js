

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
      error_description: "Couldn't unlink account for user, no linked Google account found.",
    },
  },

  googleAcct2: {
    email: process.env.SECONDARY_USERNAME,
    password: process.env.SECONDARY_PASSWORD,
  },

  googleLoginReadyCue: {
    locator: {
      text: 'Email',
    },
  },

  googleEmailField: {
    locator: {
      css: '#identifierId',
    },
  },

  googleEmailNext: {
    locator: {
      css: '#identifierNext',
    },
  },

  googlePasswordField: {
    locator: {
      css: 'input[type="password"]',
    },
  },

  googlePasswordNext: {
    locator: {
      css: '#passwordNext',
    },
  },

  googlePasswordReadyCue: {
    locator: {
      text: 'Welcome',
    },
  },

  linkExtendAmount: 86400, // 24 hours (in seconds)

};

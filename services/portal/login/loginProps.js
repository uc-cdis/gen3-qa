/**
 * login properties
 */
module.exports = {
  path: '/login',

  ready_cue: {
    locator: {
      css: '.login-page__entries',
    },
  },

  googleLoginButton: {
    locator: {
      xpath: '//button[contains(text(), \'Google\')]',
    },
  },

  loginButton: {
    locator: {
      xpath: '//div[text()="Login"]',
      css: '.top-icon-button',
    },
  },

  logoutButton: {
    locator: {
      xpath: '//div[contains(text(), \'Logout\')]',
    },
  },
};

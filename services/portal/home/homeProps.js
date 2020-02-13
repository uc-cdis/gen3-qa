/**
 * home Properties
 */
module.exports = {
  path: '/login',

  ready_cue: {
    locator: {
      css: '.nav-bar',
    },
  },

  // Page elements

  summary: {
    locator: {
      css: '.introduction',
    },
  },

  cards: {
    locator: {
      css: '.index-button-bar__thumbnail-button',
    },
  },

  googleLoginButton: {
    locator: {
      xpath: '//button[contains(text(), \'Login from Google\')]',
    },
  },

  loginButton: {
    locator: {
      xpath: '//div[text()="Login"]',
    },
  },

  logoutButton: {
    locator: {
      xpath: '//div[contains(text(), \'Logout\')]',
    },
  },
};

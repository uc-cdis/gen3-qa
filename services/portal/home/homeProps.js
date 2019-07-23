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
      css: '.h1-typo',
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

  logoutButton: {
    locator: {
      xpath: '//div[contains(text(), \'Logout\')]',
    },
  },
};

/**
 * home Properties
 */
module.exports = {
  path: '/',

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
      xpath: '//button[contains(text(), \'Google Login\')]',
    },
  },

  logoutButton: {
    locator: {
      xpath: '//div[contains(text(), \'Logout\')]',
    },
  },
};

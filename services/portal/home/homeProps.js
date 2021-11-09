const { getHomePageDetails } = require('../../../utils/apiUtil');

/**
 * home Properties
 */
module.exports = {
  path: '/login',

  systemUsePopUp: {
    locator: {
      xpath: '//button[contains(text(), \'Accept\')]//ancestor::div[contains(@class, "popup__box")]',
    },
  },

  systemUseAcceptButton: {
    locator: {
      xpath: '//button[contains(text(), \'Accept\')]',
    },
  },

  ready_cue: {
    locator: {
      css: '.nav-bar',
    },
  },

  // Page elements

  summary: {
    locator: getHomePageDetails('summary'),
  },

  cards: {
    locator: getHomePageDetails('cards'),
  },

  googleLoginButton: {
    locator: {
      xpath: 'xpath: //button[contains(text(), \'Google\') or contains(text(), \'BioData Catalyst Developer Login\')]',
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

const { getHomePageDetails } = require('../../../utils/apiUtil');

/**
 * home Properties
 */
module.exports = {
  path: 'login',

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

  logoutButton: {
    locator: {
      xpath: '//div[contains(text(), \'Logout\')]',
    },
  },

  systemUseAcceptButton: {
    xpath: '//div[@class="popup__foot"]//button[contains(text(), "Accept")]',
  },
};

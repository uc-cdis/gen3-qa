const homeProps = require('./homeProps.js');
const portalHelper = require('../portalHelper.js');

const I = actor();

/**
 * home Questions
 */
module.exports = {
  haveAccessToken() {
    I.seeCookie('access_token');
  },

  seeDetails() {
    portalHelper.seeProp(homeProps.summary, 5, 1);
    portalHelper.seeProp(homeProps.cards, 5, 4);
  },
};

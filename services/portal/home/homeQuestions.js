const homeProps = require('./homeProps.js');
const portalUtil = require('../../../utils/portalUtil.js');

const I = actor();

/**
 * home Questions
 */
module.exports = {
  haveAccessToken() {
    I.seeCookie('access_token');
  },

  seeDetails() {
    portalUtil.seeProp(homeProps.summary, 5, 1);
    portalUtil.seeProp(homeProps.cards, 5, 4);
  },
};

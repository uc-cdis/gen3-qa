const homeProps = require('./homeProps.js');
const portalUtil = require('../../../utils/portalUtil.js');

const I = actor();

/**
 * home Tasks
 */
module.exports = {
  goTo() {
    I.amOnPage(homeProps.path);
    portalUtil.seeProp(homeProps.ready_cue, 10);
  },
};

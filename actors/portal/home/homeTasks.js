const homeProps = require('./homeProps.js');
const portalHelper = require('../portalHelper.js');

const I = actor();

/**
 * home Tasks
 */
module.exports = {
  goTo() {
    I.amOnPage(homeProps.path);
    portalHelper.seeProp(homeProps.ready_cue, 10);
  },
};

const homeProps = require('./homeProps.js');
const portal = require('../../../utils/portal.js');

const I = actor();

/**
 * home Tasks
 */
module.exports = {
  goTo() {
    I.amOnPage(homeProps.path);
    portal.seeProp(homeProps.ready_cue, 10);
  },
};

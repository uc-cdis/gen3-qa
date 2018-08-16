'use strict';
  
const home_props = require('./home_props.js');
const portal_helper = require('../portal_helper.js');
let I = actor();

/**
 * home Tasks
 */
module.exports = {
  goTo() {
    I.amOnPage(home_props.path);
    portal_helper.seeProp(home_props.ready_cue, 10);
  }
};

'use strict';
  
let chai = require('chai');
let expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

const home_props = require('./home_props.js');
const portal_helper = require('../portal_helper.js');
let I = actor();

/**
 * home Questions
 */
module.exports = {
  haveAccessToken() {
    I.seeCookie('access_token');
  },

  seeDetails() {
    portal_helper.seeProp(home_props.summary, 5, 1);
    portal_helper.seeProp(home_props.cards, 5, 4);
  }
};


const homepage = require('../home/home_actor.js');
const { navbar } = require('../fragments/navbar_actor.js');
const dict_props = require('./dict_props.js');
const portal_helper = require('../portal_helper');

const I = actor();

/**
 * Dictionary Tasks
 */
module.exports = {
  goTo() {
    homepage.do.goTo();
    portal_helper.clickProp(navbar.props.dictionary);
    portal_helper.seeProp(dict_props.ready_cue);
  },

  toggleGraph() {
    portal_helper.clickProp(dict_props.graphToggle);
  },
};

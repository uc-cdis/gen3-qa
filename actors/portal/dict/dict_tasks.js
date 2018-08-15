const homepage = require('../home/home_actor.js');
const { navbar } = require('../fragments/navbar_actor.js');
const dict_props = require('./dict_props.js');
const generic = require('../fragments/generic_actor');

let I = actor();

/**
 * Internal Helpers
 */
_click = (prop) => {

};


/**
 * Dictionary Tasks
 */
module.exports = {
  // Generic Tasks
  // clickProp: clickProp,

  // Custom Tasks
  goTo() {
    homepage.do.goTo();
    // how to handle the click method?
    generic.do.clickProp(navbar.props.dictionary);
    generic.ask.seeProp(dict_props.ready_cue);
  },

  jumpTo() {
    I.amOnPage(dict_props.path)
  },

  toggleGraph() {
    clickProp()
  }
};
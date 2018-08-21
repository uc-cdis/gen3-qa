// const {
//   clickProp
// } = require('../generic_tasks.js');

/**
 * Navbar Actor
 */
const I = actor();

const navbar_props = {
  context: '.nav-bar',
  dictionary: {
    locators: {
      xpath:
        '//div[contains(text(), "Dictionary")][contains(@class, "nav-button")]',
    },
  },
  files: {
    locators: {
      text: 'Files',
    },
  },
};

const navbar_tasks = {
  // clickProp: clickProp
  clickProp() {
    console.log('hiiiii');
  },
};

module.exports.navbar = {
  props: navbar_props,
  do: navbar_tasks,
  ask: null,
};

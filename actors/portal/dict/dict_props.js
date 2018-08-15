/**
 * Dictionary Properties
 */
module.exports = {
  path: '/dd',

  ready_cue: {
    locators: {
      css: '.data-dictionary__table'
    }
  },

  // Page Elements
  tables: {
    context: '.main-content',
    locators: {
      css: '.data-dictionary__table'
    }
  },

  graphToggle: {
    context: '.sc-jTzLTM',
    locators: {
      xpath: '//a[contains(text(), "Explore dictionary")]'
    }
  },

  generalItemDetails: {
    context: '.sc-brqgnP',
    locators: {
      css: '.data-dictionary__table-data'
    }
  }
};
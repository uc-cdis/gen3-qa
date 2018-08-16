/**
 * Dictionary Properties
 */
module.exports = {
  path: '/dd',

  ready_cue: {
    locator: {
      css: '.data-dictionary__table'
    }
  },

  // Page Elements
  tables: {
    context: '.main-content',
    locator: {
      css: '.data-dictionary__table'
    }
  },

  graphToggle: {
    context: '.sc-jTzLTM',
    locator: {
      xpath: '//a[contains(text(), "Explore dictionary")]'
    }
  },

  generalItemDetails: {
    context: '.sc-brqgnP',
    locator: {
      css: '.data-dictionary__table-data'
    }
  }
};
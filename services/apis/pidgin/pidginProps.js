/**
 * pidgin Properties
 */
module.exports = {
  resSuccess: {
    code: 200,
    success: true,
    entity_error_count: 0,
    transactional_error_count: 0
  },
  
  resFail: {
    code: 400,
    success: false
  },
  
  ready_cue: {
    locator: {
      css: '.this-element-appears-when-page-loaded'
    }
  },
  
  filterTab: {
    context: '.some-container',
    locator: {
      css: '.my-tab-class'
    }
  }
};

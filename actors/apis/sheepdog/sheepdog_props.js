'use strict';

let commons_helper = require('../../commons_helper.js')

/**
 * Sheepdog Properties
 */
const api_root = `/api/v0/submission/${commons_helper.program.name}/${commons_helper.project.name}`;
module.exports = {
  // API Config
  endpoints: {
    root: api_root,
    add: api_root,
    delete: `${api_root}/entities`,
    describe: `${api_root}/export`
  },

  resultSuccess: {
    code: 200,
    success: true,
    entity_error_count: 0,
    transactional_error_count: 0
  },

  resultFail: {
    code: 400,
    success: false
  },

  resLocators: {
    entityErrorType: 'entities[0].errors[0].type'
  },

  internalServerErrorMsg: "Internal server error. Sorry, something unexpected went wrong!"
};
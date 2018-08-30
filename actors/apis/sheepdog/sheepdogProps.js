const commonsHelper = require('../../commonsHelper.js');

/**
 * Sheepdog Properties
 */
const apiRoot = `/api/v0/submission/${commonsHelper.program.name}/${
  commonsHelper.project.name
}`;
module.exports = {
  // API Config
  endpoints: {
    root: apiRoot,
    add: apiRoot,
    delete: `${apiRoot}/entities`,
    describe: `${apiRoot}/export`,
  },

  resultSuccess: {
    code: 200,
    success: true,
    entity_error_count: 0,
    transactional_error_count: 0,
  },

  resultFail: {
    code: 400,
    success: false,
  },

  resLocators: {
    entityErrorType: 'entities[0].errors[0].type',
  },

  internalServerErrorMsg:
    'Internal server error. Sorry, something unexpected went wrong!',
};

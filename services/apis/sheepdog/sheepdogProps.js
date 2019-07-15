/**
 * Sheepdog service properties
 * @module sheepdogProps
 */

const { Commons } = require('../../../utils/commons.js');
const { Gen3Response } = require('../../../utils/apiUtil.js');

const apiRoot = `/api/v0/submission/${Commons.program.name}/${
  Commons.project.name
}`;

// Base properties for a successful result (add/delete/etc)
const resSuccessBase = {
  status: 200,
  body: {
    code: 200,
    success: true,
    entity_error_count: 0,
    transactional_error_count: 0,
  },
};

module.exports = {
  /**
   * API endpoints
   */
  endpoints: {
    root: apiRoot,
    add: apiRoot,
    delete: `${apiRoot}/entities`,
    describe: `${apiRoot}/export`,
  },

  /**
   * Gen3Response when added node successfully
   */
  resAddSuccess: new Gen3Response({
    request: {},
    ...resSuccessBase,
    ...{ body: { ...resSuccessBase.data, created_entity_count: 1 } },
  }),

  /**
   * Gen3Response when deleted node successfully
   */
  resDeleteSuccess: new Gen3Response({
    request: {},
    ...resSuccessBase,
    ...{ body: { ...resSuccessBase.data, deleted_entity_count: 1 } },
  }),

  /**
   * Gen3Response when deleted node successfully
   */
  resUpdateSuccess: new Gen3Response({
    request: {},
    ...resSuccessBase,
    ...{ body: { ...resSuccessBase.data, updated_entity_count: 1 } },
  }),

  /**
   * Gen3Response when no authentication provided
   */
  resNoAuth: new Gen3Response({
    request: {},
    status: 401,
    body: { message: 'Authentication Error: Signature has expired' },
  }),

  resLocators: {
    entityErrorType: 'data.entities[0].errors[0].type',
  },

  internalServerErrorMsg:
    'Internal server error. Sorry, something unexpected went wrong!',
};

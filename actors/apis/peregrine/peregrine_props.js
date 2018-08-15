'use strict';

let util = require('../../../steps/utilSteps');

/**
 * peregrine Properties
 */
module.exports = {
  endpoints: {
    query: '/api/v0/submission/graphql',
  },

  validAccessTokenHeader: util.getAccessTokenHeader(),

  resLocators: {
    eee: 'entities[0].errors[0].type'
  },
};

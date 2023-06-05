const chai = require('chai');

const semver = require('semver');

const peregrineProps = require('./peregrineProps.js');
const user = require('../../../utils/user.js');

const { expect } = chai;
const I = actor();

/**
 * Creates string containing an objects property names
 * @param {Object} obj - object whose properties to format
 * @returns {string} - string of all properties of the object
 */
const fieldsToString = function (obj) {
  let fieldsString = '';
  Object.keys(obj).forEach((prop) => {
    if (typeof obj[prop] === 'object') {
      // ignore attributes that are not primitive
      return;
    }
    fieldsString += `\n ${prop}`;
  });
  return fieldsString;
};

/**
 * Converts an object of graphQL filters to a string
 * @param {Object} filters - key value graphQL filters
 * @returns {string}
 */
const filtersToString = function (filters) {
  const filterString = Object.keys(filters)
    .map((filter) => {
      let filterVal = filters[filter];
      if (typeof filterVal === 'string') {
        filterVal = `"${filterVal}"`;
      }

      return `${filter}: ${filterVal}`;
    })
    .join(', ');

  return filterString;
};

/**
 * peregrine Tasks
 */
module.exports = {
  /**
   * Hits peregrine's query endpoint
   * @param {string} queryString - a string in graphQL format
   * @param {string} variablesString - a string for graphQL variables
   * @returns {Promise<Object>}
   */
  async query(queryString, variablesString) {
    return I.sendPostRequest(
      peregrineProps.endpoints.query,
      { query: queryString, variables: variablesString },
      user.mainAcct.accessTokenHeader,
    ).then((res) => res.data);
  },

  /**
   * Given a Node, queries all fields of that node type
   * @param {Node} node - Node object whose type to query
   * @param {Object} filters - filters to apply to query
   * @returns {Promise<Object>}
   */
  async queryNodeFields(node, filters) {
    // construct query string
    const fieldsString = fieldsToString(node.data);
    let filterString = '';
    if (filters !== undefined && filters !== null) {
      filterString = filtersToString(filters);
      filterString = `(${filterString})`;
    }

    const q = `{
      ${node.name} ${filterString} {
        ${fieldsString}
      }
    }`;

    // make query
    return this.query(q, null);
  },

  /**
   * Uses _<name>_count graphQL filter for a given node's type
   * @param {Node} node - node with name to query
   * @returns {Promise<Object>}
   */
  async queryCount(node) {
    const typeCount = `_${node.name}_count`;
    const q = `{
      ${typeCount}
    }`;

    return this.query(q, null);
  },

  /**
   * Uses with_path_to filter to query from one node to another
   * @param {Node} fromNode - node to start path at
   * @param {Node} toNode - node to get path to
   * @returns {Promise<Object>}
   */
  async queryWithPathTo(fromNode, toNode) {
    const q = `query Test {
    ${fromNode.name} (
        order_by_desc: "created_datetime",
          with_path_to: {
              type: "${toNode.name}", submitter_id: "${toNode.data.submitter_id}"
          }
      ) {
        submitter_id
      }
    }`;

    return this.query(q, null);
  },

  async getCoremetadata(
    file, format = 'application/json', access_token, expected_status_code=200
  ) {
    const token = {
      Accept: format,
      Authorization: access_token.Authorization,
    };

    // if peregrine is on version 3.2.0/2023.04 or newer, or on a branch, use
    // the peregrine endpoint. if not, use the deprecated pidgin endpoint
    const minSemVer = '3.2.0';
    // We need two dots here to achieve proper comparison later with other monthly versions
    const minMonthlyRelease = semver.coerce('2023.04.0', { loose: true });
    const monthlyReleaseCutoff = semver.coerce('2020', { loose: true });

    const url = await I.sendGetRequest(peregrineProps.endpoints.version)
    .then((response) => {
      var peregrineVersion = response.data.version;
      var url = peregrineProps.endpoints.coreMetadataPath;
      if (peregrineVersion) {
        try {
          peregrineVersion = semver.coerce(peregrineVersion, { loose: true });
          if (
            semver.lt(peregrineVersion, minSemVer) ||
            (semver.gte(peregrineVersion, monthlyReleaseCutoff) && semver.lt(peregrineVersion, minMonthlyRelease))
          ) {
            url = peregrineProps.endpoints.coreMetadataLegacyPath;
          }
        } catch (error) {} // can't parse or compare the peregrine version: don't use legacy url
      }
      if (process.env.DEBUG === 'true') {
        console.log(`Peregrine version: ${peregrineVersion}; core metadata endpoint: ${url}`);
      }
      return url;
    });

    const endpoint = `${url}/${file.did}`;
    const res = await I.sendGetRequest(endpoint, token);
    expect(res, 'Unable to get core metadata').to.have.property('status', expected_status_code);
    return res.data;
  },
};

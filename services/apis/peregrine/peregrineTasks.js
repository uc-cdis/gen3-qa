const peregrineProps = require('./peregrineProps.js');
const user = require('../../../utils/user.js');

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
    ).then(res => res.data);
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
};

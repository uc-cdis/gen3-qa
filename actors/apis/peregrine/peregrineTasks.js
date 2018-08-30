const peregrineProps = require('./peregrineProps.js');
const usersHelper = require('../../usersHelper.js');

const I = actor();

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
  async query(queryString, variablesString) {
    return I.sendPostRequest(
      peregrineProps.endpoints.query,
      JSON.stringify({ query: queryString, variables: variablesString }),
      usersHelper.mainAcct.accessTokenHeader,
    ).then(res => res.body);
  },

  async queryNodeFields(node, filters) {
    // query node type and include ALL fields in node
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

  async queryCount(node) {
    const typeCount = `_${node.name}_count`;
    const q = `{
      ${typeCount}
    }`;

    return this.query(q, null);
  },

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

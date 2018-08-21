

const peregrine_props = require('./peregrine_props.js');
const commons_helper = require('../../commons_helper.js');

const I = actor();

const _fieldsToString = (obj) => {
  let fields_string = '';
  Object.keys(obj).forEach(
    (prop) => {
      if (typeof obj[prop] === 'object') // ignore attributes that are not primitive
      { return; }
      fields_string += `\n ${prop}`;
    },
  );
  return fields_string;
};

const _filtersToString = (filters) => {
  const filter_string = Object.keys(filters).map((filter) => {
    let filter_val = filters[filter];
    if (typeof filter_val === 'string') { filter_val = `"${filter_val}"`; }

    return `${filter}: ${filter_val}`;
  }).join(', ');

  return filter_string;
};

/**
 * peregrine Tasks
 */
module.exports = {
  async query(query_string, variables_string) {
    return I.sendPostRequest(
      peregrine_props.endpoints.query,
      JSON.stringify(
        { query: query_string, variables: variables_string },
      ),
      commons_helper.validAccessTokenHeader)
      .then(res => res.body);
  },

  async queryNodeFields(node, filters) {
    // query node type and include ALL fields in node
    const fields_string = _fieldsToString(node.data);
    let filter_string = '';
    if (filters !== undefined && filters !== null) {
      filter_string = _filtersToString(filters);
      filter_string = `(${filter_string})`;
    }

    const q = `{
      ${node.name} ${filter_string} {
        ${fields_string}
      }
    }`;

    // make query
    return this.query(q, null);
  },

  async queryCount(node) {
    const type_count = `_${node.name}_count`;
    const q = `{
      ${type_count}
    }`;

    return this.query(q, null);
  },

  async queryWithPathTo(from_node, to_node) {
    const q = `query Test {
    ${from_node.name} (
        order_by_desc: "created_datetime",
          with_path_to: {
              type: "${to_node.name}", submitter_id: "${to_node.data.submitter_id}"
          }
      ) {
        submitter_id
      }
    }`;

    return this.query(q, null);
  },
};

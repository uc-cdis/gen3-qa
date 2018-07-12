'use strict';

let util = require('./utilSteps');
let accessTokenHeader = util.getAccessTokenHeader();

const graphql_endpoint = "/api/v0/submission/graphql";


function nodeFieldsToString(obj) {
  let arg_string = "";
  Object.keys(obj).forEach(
    (prop) => {
      if (typeof obj[prop] === 'object') // ignore attributes that are not primitive
        return;
      arg_string = arg_string + `\n ${prop}`;
    }
  );
  return arg_string;
}


module.exports.makeGraphQLNodeQuery = async function(type, node, filter_string) {
  // query node type by filter_string and include ALL fields in node
  let fields_string = nodeFieldsToString(node.data);
  filter_string = filter_string == null || filter_string === "" ? " " : `(${filter_string})`;
  let q = `{
    ${type}${filter_string} {
      ${fields_string}
    }
  }`;

  // make query
  return this.makeGraphQLQuery(q, null);
};


module.exports.makeGraphQLQuery = function(query_string, variables_string) {
  return this.sendPostRequest(
    graphql_endpoint,
    JSON.stringify(
      {query: query_string, variables: variables_string}
      ),
    accessTokenHeader)
    .then(
      (res) => res.body
    )
};


module.exports.graphQLCountType = async function(type) {
  let type_count = `_${type}_count`;
  let q = `{
    ${type_count}
  }`;

  return this.makeGraphQLQuery(q, null);
};

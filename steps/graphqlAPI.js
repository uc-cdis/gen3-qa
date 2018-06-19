'use strict';

let util = require('./utilAPI');
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

module.exports.gqlNodeQuery = async function(type, node, filter_string) {
  // query node type by filter_string and include all fields in node
  let fields_string = nodeFieldsToString(node.data);
  let q = `{
    ${type}(${filter_string}) {
      ${fields_string}
    }
  }`;

  // make query
  return this.sendPostRequest(graphql_endpoint, JSON.stringify({query: q, variables: null}), accessTokenHeader)
    .then(
      (res) => res.body
    )
};

module.exports.gqlQuery = function(query_string, variables_string) {
  return this.sendPostRequest(
    graphql_endpoint, JSON.stringify({query: query_string, variables: variables_string}), accessTokenHeader)
    .then(
      (res) => {
        if (res.body.hasOwnProperty("data"))
          return res.body;
        else
          throw new Error(res.body);
      }
    ).catch(
      (e) => {
        console.log(e);
        return e.message;
      }
    )
};

module.exports.gqlCountType = async function(type) {
  let type_count = `_${type}_count`;
  let q = `{
    ${type_count}
  }`;
  return this.gqlQuery(q, null).then(
    (res) => {
      if (res.data.hasOwnProperty(type_count))
        return res.data[type_count];
      else
        throw new Error(res.body)
    }
  ).catch(
    (e) => {
      console.log(e);
      return e.message;
    }
  )
};
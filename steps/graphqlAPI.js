'use strict';

let util = require('./utilAPI');
let accessTokenHeader = util.getAccessTokenHeader();

const graphql_endpoint = "/api/v0/submission/graphql";


function objectToArgString(obj) {
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

module.exports.gqlNodeExists = async function(type, node, filter_string) {
  //TODO use the graphqlQuery function
  // query node type by submitter_id (assumed to be unique for type) and get all fields
  let fields_string = objectToArgString(node.data);
  let q = `{
    ${type}(${filter_string}) {
      ${fields_string}
    }
  }`;

  // make query and determine if equal
  return this.sendPostRequest(graphql_endpoint, JSON.stringify({query: q, variables: null}), accessTokenHeader)
    .then(
      (res) => {
        if (!res.body.data.hasOwnProperty(type))
          return false; // no data returned
        if (res.body.data[type].length === 0)
          return false; // no data was found
        let gql_data = res.body.data[type][0]; // currently just looking at first result
        // verify all attributes are equal
        for (let prop in gql_data) {
          if (gql_data.hasOwnProperty(prop) && node.data.hasOwnProperty(prop)) {
            if (gql_data[prop] !== node.data[prop])
              return false;
          }
        }
        return true;
      }
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
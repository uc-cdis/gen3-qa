'use strict';

let util = require('./utilAPI');
let accessTokenHeader = util.getAccessTokenHeader();

module.exports.getIndexd = async function(index_endpoint, did) {
  // get data from indexd
  return this.sendGetRequest(`${index_endpoint}${did}`, accessTokenHeader).then(
    (res) => {
      return res.body;
    }
  )
};

module.exports.didFromFileId = async function(sheep_endpoint, file) {
  // get did from sheepdog id
  let sheepdog_endpoint = `${sheep_endpoint}${file.program}/${file.project}/export?ids=${file.id}&format=json`;
  return this.sendGetRequest(sheepdog_endpoint, accessTokenHeader).then(
    (res) => {
      res = JSON.parse(res.body)[0];
      if (res.hasOwnProperty('object_id')) {
        return res.object_id;
      }
      else
        throw new Error(res.message);
    }
  ).catch(
    (e) => {
      console.log(e);
      return e.message;
    }
  )
};

module.exports.submitFile = function(sheep_endpoint, index_endpoint, file) {
  return this.sendPutRequest(
    `${sheep_endpoint}${file.program}/${file.project}/`, JSON.stringify(file.data), accessTokenHeader).then(
    (res) => {
      if (res.body.hasOwnProperty('entities')) {
        file.id = res.body.entities[0].id;
        // get did from the sheepdog id
        return this.didFromFileId(sheep_endpoint, file).then(
          (did) => {
            file.did = did;
            // get and return indexd data
            return this.getIndexd(index_endpoint, did).then(
              (indexd_res) => {
                return indexd_res;
              }
            )
          }
        )
      }
      else
        throw new Error(res.body.message);
    }).catch(
    (e) => {
      console.log(e);
      return e.message;
    }
  )
};

module.exports.deleteFile = function(endpoint, file) {
  let delete_url = `${endpoint}${file.program}/${file.project}/entities/${file.id}`;
  return this.sendDeleteRequest(delete_url, accessTokenHeader)
    .then(
      (res) => {
        if (res.statusCode === 200)
          return true;
        else
          console.log("Error deleting file:", res.body);
        return false;
      }
    ).catch(
    (e) => {
      console.log(e);
      return e.message;
    }
  )
};

module.exports.addNode = async function(endpoint, node) {
  return this.sendPutRequest(
    `${endpoint}${node.program}/${node.project}/`, JSON.stringify(node.data), accessTokenHeader)
    .then( (res) => {
      if (res.body.hasOwnProperty('entities')) {
        node.data.id = res.body.entities[0].id;
      }
      else {
        console.log("Error adding node: \n", res.body);
        return false; // failed to add a node
      }
      return true;
    })
};

module.exports.addNodes = async function(endpoint, nodes) {
  // add nodes, in sorted key ascending order
  for (let node of nodes.sort((a, b) => {return a.key - b.key})) {
    let nodeAdded = await this.addNode(endpoint, node);
    if (!nodeAdded)
      return false;
  }
  return true;
};

module.exports.deleteNode = async function(endpoint, node) {
  let delete_endpoint = `${endpoint}${node.program}/${node.project}/entities/${node.data.id}`;
  return this.sendDeleteRequest(delete_endpoint, accessTokenHeader)
    .then( (res) => {
      if (res.statusCode !== 200) {
        // failed to delete a node
        console.log("Error deleting node: \n", res.body);
        res.body.entities[0].errors.forEach((e) => {console.log("ERROR: ", e)})
        return false;
      }
      return true;
    });
};

module.exports.deleteNodes = async function(endpoint, nodes) {
  // remove nodes, in reverse sorted (descending key) order
  for (let node of nodes.sort((a, b) => {return b.key - a.key})) {
    let nodeDeleted = await this.deleteNode(endpoint, node);
    if (!nodeDeleted)
      return false;
  }
  return true;
};
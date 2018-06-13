'use strict';

let util = require('./utilAPI');
let accessTokenHeader = util.getAccessTokenHeader();

module.exports.submitFile = function(sheep_endpoint, index_endpoint, file) {
  return this.sendPutRequest(
    `${sheep_endpoint}${file.program}/${file.project}/`, JSON.stringify(file.data), accessTokenHeader).then(
    (res) => {
      if (res.body.hasOwnProperty('entities')) {
        console.log("PUT Result", res.body);
        console.log("PUT Errors:", res.body.entities[0].errors);
        let new_id = res.body.entities[0].id;
        file.id = new_id;
        let get_file = `${sheep_endpoint}${file.program}/${file.project}/export?ids=${new_id}&format=json`;
        // get file from sheepdog to get did
        return this.sendGetRequest(get_file, accessTokenHeader).then(
          (res) => {
            res = JSON.parse(res.body)[0];
              if (res.hasOwnProperty('object_id')) {
              file.did = res.object_id;
              // get file from indexd
              return this.sendGetRequest(`${index_endpoint}${file.did}`, accessTokenHeader).then(
                (res) => {
                  if (res.statusCode === 200) {
                    console.log("Indexd Result:", res.body);
                    return res.body;
                  }
                  else
                    throw new Error(res.message);
                }
              )
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

module.exports.addNodes = function(endpoint, nodes) {
  // add nodes, in sorted key ascending order
  nodes.sort((a, b) => {return a.key - b.key}).forEach(
    (node) => {
      this.sendPutRequest(
        `${endpoint}${node.program}/${node.project}/`, JSON.stringify(node.data), accessTokenHeader).then(
        (res) => {
          if (res.body.hasOwnProperty('entities'))
            node.data.id = res.body.entities[0].id;
        }
      )
    }
  )
};

module.exports.deleteNodes = function(endpoint, nodes) {
  // remove nodes, in reverse sorted (descending key) order
  nodes.sort((a, b) => {return b.key - a.key}).forEach(
    (node) => {
      let delete_url = `${endpoint}${node.program}/${node.project}/entities/${node.data.id}`;
      this.sendDeleteRequest(delete_url, accessTokenHeader)
        .then(
          (res) => {
            if (res.statusCode !== 200)
              res.body.entities[0].errors.forEach((e) => {console.log(e)})
          }
        ).catch(
        (e) => {
          console.log(e);
          return e.message;
        }
      )
    }
  )
};
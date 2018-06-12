'use strict';

let username = process.env.INDEX_USERNAME;
let password = process.env.INDEX_PASSWORD;
let accessTokenHeaders = {
  'Accept': 'application/json',
  'Authorization': `bearer ${process.env.ACCESS_TOKEN}`
};
let indexAuth = Buffer.from(`${username}:${password}`).toString('base64');

module.exports.submitFile = function(endpoint, file) {
  return this.sendPutRequest(
    endpoint, JSON.stringify(file), accessTokenHeaders).then(
    (res) => {
      if (res.body.hasOwnProperty('entities')) {
        let new_id = res.body.entities[0].id;
        let get_file = `/api/v0/submission//dev/test/export?ids=${new_id}&format=json`;
        return this.sendGetRequest(get_file, accessTokenHeaders).then(
          (res) => {
            res = JSON.parse(res.body)[0];
            if (res.hasOwnProperty('read_groups'))
              return res;
            else
              throw new Error(res.message); // FIXME not sure if correct
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

module.exports.deleteFile = function(id) {
  let delete_url = `/api/v0/submission//dev/test/entities/${id}`;
  this.sendDeleteRequest(delete_url, accessTokenHeaders)
    .then(
      (res) => {
        if (res.statusCode === 200)
          return true;
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

module.exports.addNodes = function(endpoint, nodes) {
  nodes.forEach(
    (node) => {
      this.sendPutRequest(
        endpoint, JSON.stringify(node), accessTokenHeaders).then(
        (res) => {
          console.log(res.body);
          if (res.body.hasOwnProperty('entities'))
            node.id = res.body.entities[0].id;
        }
      )
    }
  )
};

module.exports.deleteNodes = function(endpoint, nodes) {
  nodes.reverse().forEach(
    (node) => {
      let delete_url = `/api/v0/submission//dev/test/entities/${node.id}`;
      this.sendDeleteRequest(delete_url, accessTokenHeaders)
        .then(
          (res) => {
            console.log(res.body);
            if (res.statusCode !== 200)
              //throw new Error(res.message);
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
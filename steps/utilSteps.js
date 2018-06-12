'use strict';

let username = process.env.INDEX_USERNAME;
let password = process.env.INDEX_PASSWORD;
let indexAuth = Buffer.from(`${username}:${password}`).toString('base64');


module.exports.getAccessTokenHeader = function() {
  return {
    'Accept': 'application/json',
    'Authorization': `bearer ${process.env.ACCESS_TOKEN}`
  };
};


module.exports.getIndexAuthHeader = function() {
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json; charset=UTF-8',
    'Authorization': `Basic ${indexAuth}`
  };
};


module.exports.getProgramName = function() {
  return process.env.HOSTNAME.startsWith('qa') ? 'QA' : 'DEV';
};


module.exports.getProjectName = function() {
  return 'test';
};


module.exports.getIndexdRoot = function() {
  return "/index/index/"
};


module.exports.getSheepdogRoot = function() {
  return "/api/v0/submission/"
};

module.exports.sortByKey = function(obj_list) {
  obj_list.sort((a, b) => {return a.key - b.key})
};
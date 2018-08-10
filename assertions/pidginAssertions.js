'use strict';

let assert = require('assert');

module.exports.seeJsonCoremetadata = function(file, metadata) {
  let data = JSON.parse(metadata);
  assert.equal(data['file_name'], file.data.file_name);
  assert.equal(data['object_id'], file.did);
  assert.equal(data['type'], file.data.type);
  assert.equal(data['data_format'], file.data.data_format);
};

module.exports.seeBibtexCoremetadata = function(file, metadata) {
  assert.ok(metadata.includes(file.data.file_name),
    'file_name ' + file.data.file_name + ' not in core metadata');

  assert.ok(metadata.includes(file.did),
    'object_id ' + file.did + ' not in core metadata');

  assert.ok(metadata.includes(file.data.type),
    'type ' + file.data.type + ' not in core metadata');

  assert.ok(metadata.includes(file.data.data_format),
    'data_format ' + file.data.data_format + ' not in core metadata');
};

module.exports.seePidginError = function(data) {
  assert.throws(()=>JSON.parse(data), Error);
};

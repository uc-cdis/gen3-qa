'use strict';

module.exports.getFiles = function(base_data) {
  let valid_file = clone(base_data);

  let invalid_prop = clone(base_data);
  invalid_prop.file_size = "hello";

  let missing_required = clone(base_data);
  delete missing_required.md5sum;

  return {
    valid_file: {
      "data": valid_file
    },
    invalid_prop: {
      "data": invalid_prop
    },
    missing_required: {
      "data": missing_required
    }
  };
};

const clone = function(obj) {
  return JSON.parse(JSON.stringify(obj));
};

module.exports.extractFile = function(nodes) {
  let file_node_name = Object.keys(nodes).find((node_name) => { return nodes[node_name].category === 'data_file' });
  let bfd = clone(nodes[file_node_name].data);
  delete nodes[file_node_name];
  return bfd;
};

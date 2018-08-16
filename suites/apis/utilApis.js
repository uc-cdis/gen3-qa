'use strict';

module.exports.clone = function(obj) {
  return JSON.parse(JSON.stringify(obj));
};

module.exports.extractFile = function(nodes) {
  let file_node_name = Object.keys(nodes).find((node_name) => { return nodes[node_name].category === 'data_file' });
  let bfd = this.clone(nodes[file_node_name].data);
  delete nodes[file_node_name];
  return bfd;
};

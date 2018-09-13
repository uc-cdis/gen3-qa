// 'use strict';
//
// let assert = require('assert');
// let util = require('./utilApis');
//
// Feature('GetCoreMetadata');
//
// // test data
// let valid_file;
// let invalid_id_file;
//
// Scenario('test core metadata', async(I) => {
//   let metadata = await I.getCoremetadata(valid_file, 'json');
//   I.seeJsonCoremetadata(valid_file, metadata);
//
//   metadata = await I.getCoremetadata(valid_file, 'bibtex');
//   I.seeBibtexCoremetadata(valid_file, metadata);
// });
//
// Scenario('test core metadata invalid object_id', async(I) => {
//   let data = await I.getCoremetadata(invalid_id_file, 'json');
//   I.seePidginError(data);
// });
//
// Scenario('test core metadata no permission', async(I) => {
//   let invalid_token = { 'Authorization': 'invalid' };
//   let data = await I.getCoremetadata(valid_file, 'json', invalid_token);
//   I.seePidginError(data);
// });
//
// BeforeSuite(async (I) => {
//   // try to clean up any leftover nodes
//   await I.findDeleteAllNodes();
//
//   // submit test data
//   let nodes = I.getNodePathToFile();
//   await I.addNodes(I.getSheepdogRoot(), Object.values(nodes));
//   I.seeAllNodesAddSuccess(Object.values(nodes));
//
//   valid_file = {
//     "data": util.extractFile(nodes)
//   };
//   await I.submitFile(I.getSheepdogRoot(), valid_file);
//
//   invalid_id_file = util.clone(valid_file);
//   invalid_id_file.did = 'invalid_object_id';
// });
//
// AfterSuite(async (I) => {
//   await I.findDeleteAllNodes();
// });

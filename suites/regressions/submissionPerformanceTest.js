Feature('Submission Performance Tests').tag('@regressions');
const request = require('request');

var dataUrlsFromEnv = `${process.env.presignURLs}`.split(' ');

var assert = require('assert');
var path = require('path');
// var nodes = require('../../utils/nodes.js');

// async function node() {
//   var data = []
//   for (const url of dataUrlsFromEnv) {
//     node = url.substring(0, url.indexOf('?'));
//     node = path.basename(node, path.extname(node));
//     nodeToAdd = await nodes.getNodeFromURL(url);
//     data += nodeToAdd;
//     break
//   }
//   return data;
// }

// var data = node();

// var data = [];
// console.log(data);
// console.log(typeof(data));

// function downloadFile(url) {
//   return new Promise((resolve, reject) => {
//     request(url, { json: true }, (err, res, body) => {
//       if (err) { return reject(err); }
//       resolve(body);
//     })
//   });
// }

// function getNodeFromURL(dataUrl) {
//   return downloadFile(dataUrl).then(
//     (fileContents) => {
//       let nodeObj = JSON.parse(JSON.stringify(fileContents));
//       var node = new Node({});
//       node.data = nodeObj;
//       node.orig_props = {'data': nodeObj};
//       return node;
//     }
//   )
// }
// let data = []

// BeforeSuite((sheepdog, nodes) => {
//   console.log('!');
//   for (const url of dataUrlsFromEnv) {
//     console.log(url);
//     node = url.substring(0, url.indexOf('?'));
//     node = path.basename(node, path.extname(node));
  
//     getNodeFromURL(url).then(
//       (nodeAdded) => {
//         data.push({'node': node, 'object': nodeAdded})
//       }
//     );
//   }
// });

// Scenario('test 2')

// Data(data).Scenario('Test', (I, current, sheepdog) => {
//   console.log(Promise.resolve(current));
//   nodeAdded = sheepdog.do.addNode(current);
//   assert.notEqual(nodeAdded.addRes.body.message, 'internal server error');
//   // console.log(current);
// });




// var nodes = require('../../utils/nodes.js');



// n.forEach();

// (async function() {
//   for await (let x of node) {
//     console.log(x);
//   }
// })();

// console.log(Promise.all(node()));

// Data(datum).Scenario('Test', async (I, current, sheepdog) => {
//   console.log(Promise.resolve(current));
//   nodeAdded = await sheepdog.do.addNode(current);
//   assert.notEqual(nodeAdded.addRes.body.message, 'internal server error');
//   // console.log(current);
// });
















var nodeToAdd;
var download_url;


Before(async (sheepdog, nodes) => {
  nodeToAdd = await nodes.getNodeFromURL(download_url);
});

// var download_url;
// BeforeSuite((sheepdog, nodes) => {
//   console.log('!');
//   for (const url of dataUrlsFromEnv) {
//     console.log(url);
//     node = url.substring(0, url.indexOf('?'));
//     node = path.basename(node, path.extname(node));
  
//     getNodeFromURL(url).then(
//       (nodeAdded) => {
//         data.push({'node': node, 'object': nodeAdded})
//       }
//     );
//   }
// });

for (const url of dataUrlsFromEnv) {
  download_url = url;

  node = url.substring(0, url.indexOf('?'));
  node = path.basename(node, path.extname(node));

  var scenarioName = `(Scenario) Submission @regressions @submissionPerformanceTest ${node} ${process.env.DB} ${process.env.SIZE}`
  Scenario(scenarioName, async (sheepdog) => {
    nodeAdded = await sheepdog.do.addNode(nodeToAdd);
    assert.notEqual(nodeAdded.addRes.body.message, 'internal server error');
  });
}

// Scenario(`(Scenario) Submission tiny db @submissionPerformanceTest ${process.env.NODE} ${process.env.DB} ${process.env.SIZE} @regressions`, async (sheepdog, nodes, users) => {
//     //console.log('\n\n\nwhat are we initially adding: ', nodeToAdd);
//     for (const node of data) {
//       nodeAdded = await sheepdog.do.addNode(node);
//       assert.notEqual(nodeAdded.addRes.body.message, 'internal server error');
//     }
//     //assert.notEqual(typeof nodeToAdd.data.id, 'undefined');
// });

// After(async (sheepdog, nodes) => {
//   //console.log('\n\nnodeToAdd: ', nodeToAdd);
//   //console.log('\n\nnodeToAdd.data: ', nodeToAdd.data);
//   // await sheepdog.complete.deleteNode(nodeToAdd);
//   // await sheepdog.complete.findDeleteAllNodes();
// });
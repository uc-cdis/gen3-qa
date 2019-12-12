const path = require('path');
const fs = require('fs');
const nodes = require('./nodes');
const usersUtil = require('./user');
const peregrine = require('../services/apis/peregrine/peregrineService');

let allNodeTypes;
const backrefTranslator = { program: 'programs' };
const programSlashProject = `${process.env.PROGRAM_SLASH_PROJECT}`;

class DataNodes {
  /**
   * Class for storing node name and nodes data
   * @param props
   */
  constructor(props) {
    this.name = props.name;
    this.size = props.size;
    this.nodes = props.nodes;
  }

  /**
   * Returns only node name
   * CodeceptJS will append this to Test name
   * @returns {string}
   */
  toString() {
    if (this.size) {
      return `${this.name} ${this.size}`;
    }
    return `${this.name}`;
  }
}

/**
 * Download and store all data nodes
 * @param dataUrls
 * @returns {Array}
 */
function getNodesFromURLs(dataUrls) {
  const data = [];
  for (const presignUrl of dataUrls) {
    const size = presignUrl.split(':=')[0];
    const url = presignUrl.split(':=')[1];
    let name = url.substring(0, url.indexOf('?'));
    name = path.basename(name, path.extname(name));
    data.push(new DataNodes({ name, size, nodes: nodes.getNodeFromURL(url) }));
  }
  return data;
}

// In dictionary.json, node names are changed (generally made plural) when they are properties
// on other nodes. This function translates a node name to this "backref" property-name form.
function getPluralForm(node) {
  if (Object.prototype.hasOwnProperty()) {
    if (backrefTranslator.hasOwnProperty(node.name)) {
      return backrefTranslator[node.name];
    }
  }

  const parentLinks = node.fields.links;
  if (parentLinks.length > 0) {
    const pluralForm = parentLinks[0].backref;
    backrefTranslator[node.name] = pluralForm;
    return pluralForm;
  }

  return node.name;
}

// Recursive function to generate full query, from a start node and below.
// Node names are in "plural" form when they are queried as properties;
// initially the func is called with pluralFormBool = false
function generateBottomUpSubQuery(nodesList, indexOfStartNode, pluralFormBool) {
  const node = nodesList[indexOfStartNode];

  let nodeName = node.name;
  let nodeProperties = Object.keys(node.fields.properties);

  if (pluralFormBool) {
    nodeName = getPluralForm(node);
  }

  let subquery;
  // If we aren't on the final node, recurse on the child to build the subquery
  if (indexOfStartNode !== nodesList.length - 1) {
    subquery = generateBottomUpSubQuery(nodesList, indexOfStartNode + 1, true);
    const childName = getPluralForm(nodesList[indexOfStartNode + 1]);
    nodeProperties = nodeProperties.filter((item) => item !== childName);
  } else {
    subquery = '';
  }

  if (indexOfStartNode !== 0) {
    // Nodes have their parents as properties on themselves.
    // That breaks the query. So we filter out.
    const parentName = getPluralForm(nodesList[indexOfStartNode - 1]);
    nodeProperties = nodeProperties.filter((item) => item !== parentName);
  }

  // Filter out all non-scalar types
  nodeProperties = nodeProperties.filter((item) => !allNodeTypes.includes(item));
  nodeProperties = nodeProperties.filter((item) => item !== 'submitted_aligned_reads_files');
  nodeProperties = nodeProperties.filter((item) => item !== 'submitted_unaligned_reads_files');

  return `${nodeName} { ${nodeProperties.join(' ')} ${subquery} }`;
}

// stopAtIndex: where to stop recursing. If this is zero for example, the query will just be
// programs { <fields-on-program> } without any recursion. If it is nodesList.length, we get the
// same result as the BottomUp function -- the full query recursed down to the leaf.
function generateTopDownSubQuery(nodesList, indexOfStartNode, pluralFormBool, stopAtIndex) {
  const node = nodesList[indexOfStartNode];

  let nodeName = node.name;
  let nodeProperties = Object.keys(node.fields.properties);

  if (pluralFormBool) {
    nodeName = getPluralForm(node);
  }

  let subquery;
  if (stopAtIndex === indexOfStartNode) {
    subquery = '';
  } else {
    subquery = generateTopDownSubQuery(nodesList, indexOfStartNode + 1, true, stopAtIndex);
    const childName = getPluralForm(nodesList[indexOfStartNode + 1]);
    nodeProperties = nodeProperties.filter((property) => property.name !== childName);
  }

  if (indexOfStartNode !== 0) {
    // Nodes have their parents as properties on themselves. That breaks the query. So we filter out.
    const parentName = getPluralForm(nodesList[indexOfStartNode - 1]);
    nodeProperties = nodeProperties.filter((item) => item !== parentName);
  }

  // Filter out all non-scalar types
  nodeProperties = nodeProperties.filter((item) => !allNodeTypes.includes(item));
  nodeProperties = nodeProperties.filter((item) => item !== 'submitted_aligned_reads_files');
  nodeProperties = nodeProperties.filter((item) => item !== 'submitted_unaligned_reads_files');

  return `${nodeName} { ${nodeProperties.join(' ')} ${subquery} }`;
}

function dictionaryToAdjacencyList(fullDictionary) {
  const fd = fullDictionary;
  const dataDictionary = Object.keys(fd)
    .filter((key) => !key.startsWith('_')
      && fd[key].type === 'object'
      && fd[key].category !== 'internal')
    .reduce((acc, key) => (acc[key] = fd[key], acc), {});

  allNodeTypes = Object.keys(dataDictionary);

  const adjacencyList = {};
  for (let nodeName in dataDictionary) {
    if (Object.prototype.hasOwnProperty.call(dataDictionary, nodeName)){
      const linkArray = dataDictionary[nodeName].links;
      for (let i = 0; i < linkArray.length; i += 1) {
        if (linkArray[i].required) {
          const myBackRefName = linkArray[i].backref;
          if (!allNodeTypes.includes(myBackRefName) && typeof myBackRefName !== 'undefined') {
            allNodeTypes.push(myBackRefName);
          }
          backrefTranslator[nodeName] = myBackRefName;

          const parentOfThisNode = linkArray[i].target_type;
          if (!Object.prototype.hasOwnProperty.call(adjacencyList, 'parentOfThisNode')) {
            adjacencyList[parentOfThisNode] = [nodeName];
          } else {
            adjacencyList[parentOfThisNode].push(nodeName);
          }
        }
      }
    }
  }

  return adjacencyList;
}

// Recursive depth first search for longest path
function DFS(adjacencyList, startNode) {
  const children = adjacencyList[startNode];
  let longestPath = [startNode];

  if (typeof children === 'undefined' || children.length === 0) {
    return longestPath;
  }

  for (let i = 0; i < children.length; i += 1) {
    const longestSubPath = [startNode].concat(DFS(adjacencyList, children[i]));
    if (longestSubPath.length > longestPath.length) {
      longestPath = longestSubPath;
    }
  }

  return longestPath;
}

// Returns the longest path in the node tree connected by required links
function findLongestPath(fullDictionary) {
  const fd = fullDictionary;
  const adjacencyList = dictionaryToAdjacencyList(fullDictionary);

  // I think it's safe to assume that all commons have a program node. Lets take this as root.
  const longestPath = DFS(adjacencyList, 'program');

  return longestPath.map((nodeName) => ({
    name: nodeName,
    fields: fd[nodeName],
  }));
}

// Return value: a list of objects that look like {node-names : [fields on this node]}
async function retrieveDataDictionary() {
  const dictURL = `https://${process.env.HOSTNAME}/api/v0/submission/_dictionary/_all`;
  const dictionary = await nodes.downloadFile(dictURL);
  return JSON.parse(JSON.stringify(dictionary));
}

/*
 * Makes deepest possible queries on all nodes in the path provided,
 * from the bottom-most node upward, ending with the full query on program {}.
 * Like so:
 * let bottomUp = [
 *    'aligned_reads_index { ... }',
 *    'submitted_aligned_reads { ... aligned_reads_index {... }}',
 *    ...
 *    'program { ... projects { ... { aligned_reads_index { ...} ... } }'
 * ]
*/
function generateBottomUpQueries(longestPath) {
  const queryList = [];
  for (let i = 0; i < longestPath.length; i += 1) {
    queryList.push(`{ ${generateBottomUpSubQuery(longestPath, i, false)} }`);
  }
  return queryList;
}

/*
 * Makes progressively deeper queries starting from the top,
 * ending with the full query on program {},
 * which generateBottomUpQueries would provide if the start node was the first node.
 * Like so:
 * let topDown = [
 *    ' { project { id state availability_type ... }',
 *    ' { project { id state availability_type ...  experiments { ... }}',
 *    ' { project { id state availability_type ...  experiments { ...  cases { ... } }}',
 *    ...
 * ]
 * @method generateBottomUpQueries
 * @param nodesList: An ordered list of node objects, where child nodes follow their parents.
 * The nodesList provides the longest path of required links in the tree.
*/
function generateTopDownQueries(longestPath) {
  const queryList = [];
  for (let i = 0; i < longestPath.length; i += 1) {
    queryList.push(`{ ${generateTopDownSubQuery(longestPath, 0, false, i)} }`);
  }

  return queryList;
}

/*
* This function facilitates sheepdog export performance testing,
* located in exportPerformanceTest.js.
* It obtains a random record for each node depth underneath project
* in the longest path of required links (see above)
* and returns a list of IDs for these records so that we can evaluate
* query-by-ID performance at each
* depth.
*/
async function getRepresentativeIDs(nodesList) {
  const projectName = programSlashProject.split('/')[1];
  const projectIdQuery = `{ project(name:"${projectName}") { project_id } }`;
  const result = await peregrine.do.query(projectIdQuery, null);
  const projectId = result.data.project[0].project_id;

  const types = nodesList.map((x) => x.name);
  const representativeIDs = [];

  // Starting at i=2 so as to exclude the program and project nodes
  let bigQuery = '{ ';
  for (let i = 2; i < types.length; i += 1) {
    bigQuery += `${types[i]}(project_id:"${projectId}") { id } `;
  }
  bigQuery += ' }';

  const queryResult = await peregrine.do.query(bigQuery, null);
  peregrine.ask.resultSuccess(queryResult);

  const nodes = Object.keys(queryResult.data);
  for (let j = 0; j < nodes.length; j += 1) {
    const nodeName = nodes[j];
    representativeIDs.push({ name: nodeName, id: queryResult.data[nodeName][0].id });
  }

  return representativeIDs;
}

async function exportAllNodesOfASingleType(programSlashProject, nodeType) {
  const { accessTokenHeader } = usersUtil.mainAcct;
  const endpoint = `/api/v0/submission/${programSlashProject}/export?node_label=${nodeType}&with_children=true`;

  const I = actor();

  return I.sendGetRequest(
    endpoint,
    accessTokenHeader,
  )
    .then((res) => res);
}

async function exportNodesByID(id) {
  // {}/api/v0/submission/{}/{}/export?ids={}&format=json
  const { accessTokenHeader } = usersUtil.mainAcct;
  const endpoint = `/api/v0/submission/${programSlashProject}/export?ids=${id}&with_children=true`;

  console.log('Querying endpoint: ', endpoint);

  const I = actor();

  return I.sendGetRequest(
    endpoint,
    accessTokenHeader,
  )
    .then((res) => res);
}

async function writeBottomUpQueries() {
  await retrieveDataDictionary()
    .then(async (dataDictionary) => {
      const longestPath = findLongestPath(dataDictionary);
      const cBottomUpQueries = generateBottomUpQueries(longestPath)
        .join('\n');

      fs.writeFileSync('output/bottomUpQueries.txt', cBottomUpQueries, (err) => {
        if (err) console.log(err);
        console.log('Bottom up queries written to bottomUpQueries.txt.');
      });
    });
}

async function writeTopDownQueries() {
  await retrieveDataDictionary()
    .then(async (dataDictionary) => {
      const longestPath = findLongestPath(dataDictionary);
      const topDownQueries = generateTopDownQueries(longestPath)
        .join('\n');

      fs.writeFileSync('output/topDownQueries.txt', topDownQueries, (err) => {
        if (err) console.log(err);
        console.log('Bottom up queries written to topDownQueries.txt.');
      });
    });
}

async function writeLongestPath() {
  await retrieveDataDictionary()
    .then(async (dataDictionary) => {
      let longestPath = findLongestPath(dataDictionary);
      longestPath = longestPath.map((x) => x.name).join('\n');
      fs.writeFileSync('output/longestPathOfNodes.txt', longestPath, (err) => {
        if (err) console.log(err);
        console.log('Nodes written to longestPathOfNodes.txt.');
      });
    });
}

async function writeRepresentativeIDs() {
  await retrieveDataDictionary()
    .then(async (dataDictionary) => {
      const longestPath = findLongestPath(dataDictionary);
      getRepresentativeIDs(longestPath, peregrine).then((representativeIDs) => {
        const reprIDs = JSON.stringify(representativeIDs);
        fs.writeFileSync('output/representativeIDs.txt', reprIDs, (err) => {
          if (err) console.log(err);
          console.log('Representative IDs written to representativeIDs.txt.');
        });
      });
    });
}

function* bottomUpQueries() {
  if (fs.existsSync('output/bottomUpQueries.txt')) {
    const cBottomUpQueries = fs.readFileSync('output/bottomUpQueries.txt')
      .toString()
      .split('\n');
    for (let i = 0; i < cBottomUpQueries.length; i += 1) {
      yield new DataNodes({
        name: i,
        nodes: cBottomUpQueries[i],
      });
    }
  }
}

function* topDownQueries() {
  if (fs.existsSync('output/topDownQueries.txt')) {
    const varTopDownQueries = fs.readFileSync('output/topDownQueries.txt')
      .toString()
      .split('\n');
    for (let i = 0; i < varTopDownQueries.length; i += 1) {
      yield new DataNodes({
        name: i,
        nodes: varTopDownQueries[i],
      });
    }
  }
}

function* getLongestPath() {
  if (fs.existsSync('output/longestPathOfNodes.txt')) {
    const lp = fs.readFileSync('output/longestPathOfNodes.txt')
      .toString()
      .split('\n');

    for (let i = 0; i < lp.length; i += 1) {
      yield new DataNodes({
        name: lp[i],
        nodes: lp[i],
      });
    }
  }
}

function* representativeIDs() {
  if (fs.existsSync('output/representativeIDs.txt')) {
    let rids = fs.readFileSync('output/representativeIDs.txt')
      .toString()
      .split('\n');
    rids = JSON.parse(rids);
    for (let i = 0; i < rids.length; i += 1) {
      const node = rids[i];
      const nodeType = node.name;
      const { id } = node;

      yield new DataNodes({
        name: nodeType,
        nodes: id,
      });
    }
  }
}

module.exports = {
  DataNodes,
  getNodesFromURLs,
  writeBottomUpQueries,
  writeTopDownQueries,
  writeLongestPath,
  writeRepresentativeIDs,
  exportAllNodesOfASingleType,
  exportNodesByID,
  programSlashProject,
  bottomUpQueries,
  topDownQueries,
  longestPath: getLongestPath,
  representativeIDs,
};

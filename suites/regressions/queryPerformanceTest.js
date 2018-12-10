Feature('Peregrine API performance tests');

/*
* This test generates and executes expensive GraphQL queries using a commmons' dictionary.json.
* We assume a certain structure for the dictionary file, and the presence of a
* top-level node called "program". Everything else should be portable between different commons. 
*/

var nodes = require('../../utils/nodesUtil.js');

// Return value: a list of objects that look like {node-names : [fields on this node]}
async function retrieveDataDictionary() {
	let dictURL = `https://${process.env.HOSTNAME}/data/dictionary.json`;
	let dictionary = await nodes.downloadFile(dictURL);
	return JSON.parse(JSON.stringify(dictionary));
}

function dictionaryToAdjacencyList(fullDictionary) {
	let dataDictionary = Object.keys(fullDictionary)
        .filter(key => !key.startsWith('_') 
    			&& fullDictionary[key].type === 'object'
      			&& fullDictionary[key].category !== 'internal')
        .reduce( (acc, key) => (acc[key] = fullDictionary[key], acc), {} );


	// This data structure is a list of node names with "properties" (children) and "links" (parents)
	// Lets make a translator for nodes between singular and plural property-name forms
	// We can build an adjacency list representation of the required links in this tree in one pass
	// Walk down the node list and inspect all the members of the links array.
	// The backref will provide our plural translation. The target_type will give the parent node.
	// In our adj list, we can add the child node to this parent node.
	// When our walk is complete, the tree will be complete. 
	// At which point we can perform DFS to find the longest path.
	//let nodeNames = Object.keys(dataDictionary).length;
	let adjacencyList = {};
	for (let nodeName in dataDictionary) {
		let linkArray = dataDictionary[nodeName]['links'];
		for (let i = 0; i < linkArray.length; i++) {
			if (!linkArray[i]['required']) { 
				continue; 
			}

			parentOfThisNode = linkArray[i]['target_type'];
			if (!adjacencyList.hasOwnProperty(parentOfThisNode)) {
				adjacencyList[parentOfThisNode] = [nodeName];
			} else {
				adjacencyList[parentOfThisNode].push(nodeName);
			}
		}
	}

	return adjacencyList;
}

// Recursive depth first search for longest path
function DFS(adjacencyList, startNode) {
	let children = adjacencyList[startNode];
	let longestPath = [startNode];

	if(typeof children == 'undefined' || children.length == 0) {
		return longestPath;
	}

	for (var i = 0; i < children.length; i++) {
		let longestSubPath = [startNode].concat(DFS(adjacencyList, children[i]));
		if (longestSubPath.length > longestPath.length) {
			longestPath = longestSubPath;
		}
	}

	return longestPath;
}

// Returns the longest path in the node tree connected by required links
function findLongestPath(fullDictionary) {
	let adjacencyList = dictionaryToAdjacencyList(fullDictionary);

	// I think it's safe to assume that all commons have a program node. Lets take this as root.
	let longestPath = DFS(adjacencyList, 'program');

	let lPathWithNodes = longestPath.map((nodeName) => ({ name : nodeName, fields : fullDictionary[nodeName] }) );
	//console.log(JSON.stringify(lPathWithNodes));
	return lPathWithNodes;
}

function getPluralForm(node) {
	let parentLinks = node["fields"]["links"];
	if (parentLinks.length > 0) {
		return parentLinks[0]["backref"];
	}
	console.log("You asked for a backref-name of a node and we couldn't find one -- ", node["name"]);
	return node["name"]
}


// Recursive function to generate full query, from a start node and below.
// Node names are in "plural" form when they are queried as properties; initially the func is called with pluralForm false
function generateBottomUpSubQuery(nodesList, indexOfStartNode, pluralFormBool) {
	let node = nodesList[indexOfStartNode];
	let nodeName = node['name'];
	let nodeChildren = Object.keys(node['fields']['properties']);

	if (pluralFormBool) {
		nodeName = getPluralForm(node);
	}

	// If all children are scalars, we're done
	if (indexOfStartNode == nodesList.length - 1) {
		return nodeName + ' { ' +  nodeChildren.join(' ') + ' }';
	}

	// Otherwise, recurse on the non-scalar child
	let subQuery = generateBottomUpSubQuery(nodesList, indexOfStartNode + 1, true);
	
	let childName = getPluralForm(nodesList[indexOfStartNode + 1]);
	let nodeProperties = nodeChildren.filter(property => property['name'] != childName);
	return nodeName + ' { \n' + nodeProperties.join(' ') + ' ' + subQuery + ' \n}';
}


// stopAtIndex: where to stop recursing. If this is zero for example, the query will just be
// programs { <fields-on-program> } without any recursion. If it is nodesList.length, we get the 
// same result as the BottomUp function -- the full query recursed down to the leaf.
function generateTopDownSubQuery(nodesList, indexOfStartNode, pluralFormBool, stopAtIndex) {
	let node = nodesList[indexOfStartNode];
	let nodeName = node['name'];
	let nodeChildren = Object.keys(node['fields']['properties']);

	// Case where we don't need to check for properties that are children we might recurse on
	if (stopAtIndex == indexOfStartNode) {
		return nodeName + ' { ' +  nodeChildren.join(' ') + ' }';
	}

	// Otherwise, recurse on the non-scalar child
	let subQuery = generateTopDownSubQuery(nodesList, indexOfStartNode + 1, true, stopAtIndex);
	
	let childName = getPluralForm(nodesList[indexOfStartNode + 1]);
	let nodeProperties = nodeChildren.filter(property => property['name'] != childName);
	return nodeName + ' { \n' + nodeProperties.join(' ') + ' ' + subQuery + ' \n}';
}


/*
 * Makes deepest possible queries on all nodes in the path provided, from the bottom-most node upward, 
 * ending with the full query on program {}.
 * Like so: 
 * let bottomUp = [
 * 		'aligned_reads_index { ... }',
 * 		'submitted_aligned_reads { ... aligned_reads_index {... }}',
 * 		...
 * 		'program { ... projects { ... { aligned_reads_index { ...} ... } }'
 * ]
*/
function generateBottomUpQueries(nodesList) {
	let queryList = [];
	for (let i = 0; i < nodesList.length; i++) {
		queryList.push('{ ' + generateBottomUpSubQuery(nodesList, i, false) + ' }');
	}
	return queryList;
}

/*
 * Makes progressively deeper queries starting from the top, ending with the full query on program {}, 
 * which generateBottomUpQueries would provide if the start node was the first node.
 * Like so: 
 * let topDown = [
 * 		' { project { id state availability_type ... }',
 * 		' { project { id state availability_type ...  experiments { ... }}',
 * 		' { project { id state availability_type ...  experiments { ...  cases { ... } }}',
 * 		...
 * ]
 * @method generateBottomUpQueries
 * @param nodesList: An ordered list of node objects, where child nodes follow their parents. 
 * The nodesList provides the longest path of required links in the tree.
*/
function generateTopDownQueries(nodesList) {
	let queryList = [];
	for (let i = 0; i < nodesList.length; i++) {
		queryList.push('{ ' + generateTopDownSubQuery(nodesList, 0, false, i) { + ' }');
	}
	return queryList;
}

// Longest path of required links in the schema
retrieveDataDictionary().then(function(dataDictionary){
	let longestPath = findLongestPath(dataDictionary);	// list of nodes in longest path of required links
	console.log('Longest Path: ', longestPath);

	var bottomUpQueries = generateBottomUpQueries(longestPath);
	console.log(bottomUpQueries);

	var topDownQueries = generateTopDown(longestPath);
	console.log(topDownQueries);

	return;

	// Generate a scenario for each query so that they can be timed separately by the Jenkins pipeline
	for(let i = 0; i < longestPath; i++) {
		console.log('building Scneario ', i);
		Scenario('query all fields up to node depth ' + i + ' @peregrinePerformanceTest', async (peregrine, nodes) => {
			console.log(61);
			const q = generate_graphql_query(longestPath[i]);

			//console.log(JSON.stringify(nodes.getFirstNode()));
			// await sheepdog.complete.addNode(nodes.getFirstNode());
		
			// const q = `query Test { alias1: ${nodes.getFirstNode().data.type} { id } }`;
			const res = await peregrine.do.query(q, null);

			peregrine.ask.hasFieldCount(res, 'alias1', 1);

			//await sheepdog.complete.deleteNode(nodes.getFirstNode());

		});
	}




});


// BeforeSuite(async (peregrine, nodes) => {
//   // try to clean up any leftover nodes
//   //await sheepdog.complete.findDeleteAllNodes();
//   //console.log('HEYYYY\n\n\n-->>>>>>>\n\n\n');

//   // Obtain graph QL schema from host
//   // ... 
// });

// Before((nodes) => {
//   // Refresh nodes before every test to clear any appended results, id's, etc
//   // nodes.refreshPathNodes();
// });

// After(async (sheepdog, nodes) => {
//   	// await sheepdog.complete.deleteNodes(nodes.getPathToFile());
//     // await sheepdog.complete.findDeleteAllNodes();
// });


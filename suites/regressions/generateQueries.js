Feature('Generate queries for performance testing');

/*
* This test generates and executes expensive GraphQL queries using a commmons' dictionary.json.
* We assume a certain structure for the dictionary file, and the presence of
* top-level nodes "program" and "project". Everything else should be portable between different commons. 
*/

var nodes = require('../../utils/nodes');
var fs = require('fs');

var backrefTranslator = {'program' : 'programs'};
// "allNodeTypes" answers the question: which properties on a given node are not scalars (nodes themselves)? 
// We must filter out all non-scalars from a query unless we make a sub-selection on that non-scalar.
var allNodeTypes;

// Representative IDs for exportPerformanceTest.js should belong to records in the same project
var programSlashProject = `${process.env.PROGRAM_SLASH_PROJECT}`;

function dictionaryToAdjacencyList(fullDictionary) {
	let dataDictionary = Object.keys(fullDictionary)
        .filter(key => !key.startsWith('_') 
    			&& fullDictionary[key].type === 'object'
      			&& fullDictionary[key].category !== 'internal')
        .reduce( (acc, key) => (acc[key] = fullDictionary[key], acc), {} );

    allNodeTypes = Object.keys(dataDictionary);

	let adjacencyList = {};
	for (let nodeName in dataDictionary) {
		let linkArray = dataDictionary[nodeName]['links'];
		for (let i = 0; i < linkArray.length; i++) {
			if (!linkArray[i]['required']) { 
				continue; 
			}

			let myBackRefName = linkArray[i]['backref'];
			if (!allNodeTypes.includes(myBackRefName) && typeof myBackRefName != 'undefined') {
				allNodeTypes.push(myBackRefName);
			}
			backrefTranslator[nodeName] = myBackRefName;

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
	return lPathWithNodes;
}

// In dictionary.json, node names are changed (generally made plural) when they are properties
// on other nodes. This function translates a node name to this "backref" property-name form. 
function getPluralForm(node) {
	if (backrefTranslator.hasOwnProperty(node['name'])) {
		return backrefTranslator[node['name']];
	}

	let parentLinks = node["fields"]["links"];
	if (parentLinks.length > 0) {
		let pluralForm = parentLinks[0]["backref"];
		backrefTranslator[node['name']] = pluralForm;
		return pluralForm;
	}

	return node["name"];
}

// Recursive function to generate full query, from a start node and below.
// Node names are in "plural" form when they are queried as properties; initially the func is called with pluralForm false
function generateBottomUpSubQuery(nodesList, indexOfStartNode, pluralFormBool) {
	let node = nodesList[indexOfStartNode];
	let nodeName = node['name'];
	let nodeProperties = Object.keys(node['fields']['properties']);

	if (pluralFormBool) {
		nodeName = getPluralForm(node);
	}

	let subquery;
	// If we aren't on the final node, recurse on the child to build the subquery
	if (indexOfStartNode != nodesList.length - 1) {
		subQuery = generateBottomUpSubQuery(nodesList, indexOfStartNode + 1, true);
		let childName = getPluralForm(nodesList[indexOfStartNode + 1]);
		nodeProperties = nodeProperties.filter(item => item != childName);
	} else {
		subQuery = '';
	}	

	if (indexOfStartNode != 0) {
		// Nodes have their parents as properties on themselves. That breaks the query. So we filter out.
		let parentName = getPluralForm(nodesList[indexOfStartNode - 1]);
		nodeProperties = nodeProperties.filter(item => item != parentName);
	}

	// Filter out all non-scalar types
	nodeProperties = nodeProperties.filter(item => !allNodeTypes.includes(item));
	nodeProperties = nodeProperties.filter(item => item !== "submitted_aligned_reads_files");
	nodeProperties = nodeProperties.filter(item => item !== "submitted_unaligned_reads_files");

	return nodeName + ' { ' + nodeProperties.join(' ') + ' ' + subQuery + ' }';
}

// stopAtIndex: where to stop recursing. If this is zero for example, the query will just be
// programs { <fields-on-program> } without any recursion. If it is nodesList.length, we get the 
// same result as the BottomUp function -- the full query recursed down to the leaf.
function generateTopDownSubQuery(nodesList, indexOfStartNode, pluralFormBool, stopAtIndex) {
	let node = nodesList[indexOfStartNode];
	let nodeName = node['name'];
	let nodeProperties = Object.keys(node['fields']['properties']);

	if (pluralFormBool) {
		nodeName = getPluralForm(node);
	}

	let subquery;
	if (stopAtIndex != indexOfStartNode) {
		subquery = '';
	} else {
		subQuery = generateTopDownSubQuery(nodesList, indexOfStartNode + 1, true, stopAtIndex);
		let childName = getPluralForm(nodesList[indexOfStartNode + 1]);
		nodeProperties = nodeProperties.filter(property => property['name'] != childName);
	}

	if (indexOfStartNode != 0) {
		// Nodes have their parents as properties on themselves. That breaks the query. So we filter out.
		let parentName = getPluralForm(nodesList[indexOfStartNode - 1]);
		nodeProperties = nodeProperties.filter(item => item != parentName);
	}

	// Filter out all non-scalar types
	nodeProperties = nodeProperties.filter(item => !allNodeTypes.includes(item));
	nodeProperties = nodeProperties.filter(item => item !== "submitted_aligned_reads_files");
	nodeProperties = nodeProperties.filter(item => item !== "submitted_unaligned_reads_files");
	
	return nodeName + ' { ' + nodeProperties.join(' ') + ' ' + subQuery + ' }';
}

// Return value: a list of objects that look like {node-names : [fields on this node]}
async function retrieveDataDictionary() {
	let dictURL = `https://${process.env.HOSTNAME}/api/v0/submission/_dictionary/_all`;
	let dictionary = await nodes.downloadFile(dictURL);
	return JSON.parse(JSON.stringify(dictionary));
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
		queryList.push('{ ' + generateTopDownSubQuery(nodesList, 0, false, i) + ' }');
	}
	return queryList;
}

/*
* This function facilitates sheepdog export performance testing, located in exportPerformanceTest.js.
* It obtains a random record for each node depth underneath project in the longest path of required links (see above)
* and returns a list of IDs for these records so that we can evaluate query-by-ID performance at each
* depth.
*/
async function getRepresentativeIDs(nodesList, peregrine, programSlashProject) {
	let projectName = programSlashProject.split('/')[1];
	const projectIdQuery = "{ project(name:\"" + projectName + "\") { project_id } }";
	const result = await peregrine.do.query(projectIdQuery, null);
	const projectId = result["data"]["project"][0]["project_id"];
	// console.log('\n\nproject id: ', projectId); 

	let types = nodesList.map(x => x.name);
	let representativeIDs = [];

	// Starting at i=2 so as to exclude the program and project nodes
	let bigQuery = "{ ";
	for (let i = 2; i < types.length; i++) {
		bigQuery += types[i] + "(project_id:\"" + projectId + "\") { id } ";
	}
	bigQuery += " }";

	const queryResult = await peregrine.do.query(bigQuery, null);
	peregrine.ask.resultSuccess(queryResult);
	
	let nodes = Object.keys(queryResult['data']);
	for (let j = 0; j < nodes.length; j++) {
		let nodeName = nodes[j];
		representativeIDs.push({'name' : nodeName, 'id': queryResult['data'][nodeName][0]['id'] });
	}

	return representativeIDs;
}

Scenario('building test data', async (peregrine) => {
	retrieveDataDictionary().then(async function(dataDictionary) {
		let longestPath = findLongestPath(dataDictionary);
		let bottomUpQueries = generateBottomUpQueries(longestPath).join('\n');
		let topDownQueries = generateTopDownQueries(longestPath).join('\n');

		fs.writeFileSync('output/bottomUpQueries.txt', bottomUpQueries, function(err, data){
		    if (err) console.log(err);
		    console.log("Bottom up queries written to bottomUpQueries.txt.");
		});

		fs.writeFileSync('output/topDownQueries.txt', topDownQueries, function(err, data){
		    if (err) console.log(err);
		    console.log("Top down queries written to topDownQueries.txt.");
		});

		if(typeof programSlashProject != 'undefined' && programSlashProject != '' && programSlashProject != 'undefined') {
			getRepresentativeIDs(longestPath, peregrine, programSlashProject).then(function(representativeIDs) {
				representativeIDs = JSON.stringify(representativeIDs);
				fs.writeFileSync('output/representativeIDs.txt', representativeIDs, function(err, data){
				    if (err) console.log(err);
				    console.log("Representative IDs written to representativeIDs.txt.");
				});
			});
		}

		longestPath = longestPath.map(x => x.name).join('\n');	
		fs.writeFileSync('output/longestPathOfNodes.txt', longestPath, function(err, data){
		    if (err) console.log(err);
		    console.log("Nodes written to longestPathOfNodes.txt.");
		});
	});
});

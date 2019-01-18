Feature('Export Performance Tests').tag('@regressions');

/*
* Before you use this test, calculate the longest path of required links in the data dictionary with:
* TEST_DATA_PATH='' NAMESPACE=<your-namespace> npm test -- suites/regressions/generateQueries.js --verbose
* 
* Only then should you run this test file with:
* PROGRAM_SLASH_PROJECT='<program-name>/<project-name>' TEST_DATA_PATH='' NAMESPACE=<your-namespace> npm test -- suites/regressions/exportPerformanceTest.js --verbose
* 
* The nodes in this file will be 
*/

var nodes = require('../../utils/nodes');
const usersUtil = require('../../utils/user');
var fs = require('fs');
var assert = require('assert');
const chai = require('chai');
const expect = chai.expect;

const I = actor();

async function exportAllNodesOfASingleType(programSlashProject, nodeType) {
	const accessTokenHeader = usersUtil.mainAcct.accessTokenHeader;
	const endpoint = "/api/v0/submission/" + programSlashProject + 
		"/export?node_label=" + nodeType + "&with_children=true";
	
	return I.sendGetRequest(
		endpoint,
		accessTokenHeader,
		).then((res) => {
			return res;
	});
}

async function exportNodesByID(programSlashProject, id) {
	// {}/api/v0/submission/{}/{}/export?ids={}&format=json
	const accessTokenHeader = usersUtil.mainAcct.accessTokenHeader;
	const endpoint = "/api/v0/submission/" + programSlashProject + 
		"/export?ids=" + id + "&with_children=true";
	
	console.log('Querying endpoint: ', endpoint);

	return I.sendGetRequest(
		endpoint,
		accessTokenHeader,
		).then((res) => {
			return res;
	});

}

var programSlashProject = `${process.env.PROGRAM_SLASH_PROJECT}`;


if (fs.existsSync('output/longestPathOfNodes.txt')) {
	// The file generateQueries.js builds this text file. Run it before this file
	var longestPathOfNodes = fs.readFileSync('output/longestPathOfNodes.txt').toString().split('\n');
	for( let i = 0; i < longestPathOfNodes.length; i++) {
		let nodeType = longestPathOfNodes[i];
		Scenario(`(Scenario) Export all nodes of type: ${nodeType} ${process.env.DB} @exportPerformanceTest`, async (sheepdog) => {
			expect(programSlashProject).to.not.equal('', 'Please provide a value for the PROGRAM_SLASH_PROJECT environment variable');
			expect(typeof programSlashProject).to.not.equal('undefined', 'Please provide a value for the PROGRAM_SLASH_PROJECT environment variable');

			let res = await exportAllNodesOfASingleType(programSlashProject, nodeType);
			sheepdog.ask.hasStatusCode(res, 200);
		});
	}
}


if (fs.existsSync('output/representativeIDs.txt')) {
	// The file generateQueries.js builds this text file. Run it before this file
	var representativeIDs = fs.readFileSync('output/representativeIDs.txt');
	representativeIDs = JSON.parse(representativeIDs);
	for(let i = 0; i < representativeIDs.length; i++) {
		let node = representativeIDs[i];
		console.log('NODE: ', node);
		let nodeType = node['name'];
		let id = node['id'];
		Scenario(`(Scenario) Exporting a record by ID on nodes of type: ${nodeType} ${process.env.DB} @exportPerformanceTest`, async (sheepdog) => {
			expect(programSlashProject).to.not.equal('', 'Please provide a value for the PROGRAM_SLASH_PROJECT environment variable');
			expect(typeof programSlashProject).to.not.equal('undefined', 'Please provide a value for the PROGRAM_SLASH_PROJECT environment variable');

			let res = await exportNodesByID(programSlashProject, id);
			// console.log("RES: ", res.body);
			sheepdog.ask.hasStatusCode(res, 200);
		});
	}
}
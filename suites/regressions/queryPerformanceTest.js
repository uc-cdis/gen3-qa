Feature('Query Performance Tests');

/*
* Before you use this test, generate the queries by running: 
* TEST_DATA_PATH='' NAMESPACE=<your-namespace> npm test -- suites/regressions/generateQueries.js --verbose
* to generate the queries which will be read in from the file.
* 
* Only then should you run this test file with:
* TEST_DATA_PATH='' NAMESPACE=<your-namespace> npm test -- suites/regressions/queryPerformanceTest.js --verbose
* 
* This test generates and executes expensive GraphQL queries using a commmons' dictionary.json.
* We assume a certain structure for the dictionary file, and the presence of a
* top-level node called "program". Everything else should be portable between different commons. 
*/

var nodes = require('../../utils/nodes');
var fs = require('fs');

// The file generateQueries.js builds these text files
var bottomUpQueries = fs.readFileSync('output/bottomUpQueries.txt').toString().split('\n');
for(let i = 0; i < bottomUpQueries.length; i++) {
	Scenario('Executing bottomUp query #' + i + ' @queryPerformanceTest', async (peregrine, nodes) => {
		const q = bottomUpQueries[i];
		//console.log('\n\nExecuting: ', q);

		const res = await peregrine.do.query(q, null);

		//console.log('\n\nres: ', res);
		peregrine.ask.resultSuccess(res);
	});
}

var topDownQueries = fs.readFileSync('output/topDownQueries.txt').toString().split('\n');
for(let i = 0; i < topDownQueries.length; i++) {
	Scenario('(Scenario) Executing topDown query #' + i + ' @queryPerformanceTest', async (peregrine, nodes) => {
		const q = topDownQueries[i];
		// console.log('\n\nExecuting: ', q);

		const res = await peregrine.do.query(q, null);
		//console.log('\n\nres: ', res);
		peregrine.ask.resultSuccess(res);
	});
}
const pelicanQuestions = require('./pelicanQuestions.js');
const pelicanTasks = require('./pelicanTasks.js');
let I = actor();
const chai = require('chai');
let expect = chai.expect;
/**
 * pelican sequences
 */
module.exports = {
	// Sequences are for an service to combine multiple tasks and questions
	async testExport(token){
		// run the tasks related to export and check that we get a valid s3 url
		var jobID = await pelicanTasks.dispatchJob(token);
		expect(jobID.status).to.equal(200);
		jobID = jobID.body.uid;

		var jobStatus = "Running";
		while(jobStatus == "Running"){
			jobStatus = await pelicanQuestions.checkStatus(jobID, token);
			jobStatus = jobStatus.body.status;
			I.wait(5);
		}

		// check the status to make sure the job didn't fail
		expect(jobStatus).to.equal("Completed");
	},

	// Sequences are for an service to combine multiple tasks and questions
	async testExportBadToken(token){
		// run the tasks related to export and check that we get a valid s3 url
		var jobID = await pelicanTasks.dispatchJob(token);
		expect(jobID.status).to.equal(403);
	},
};

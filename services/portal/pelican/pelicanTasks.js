const pelicanProps = require('./pelicanProps.js');
const user = require('../../../utils/user.js');
const I = actor();
const portal = require('../../../utils/portal.js');
const { Bash } = require('../../../utils/bash.js');

const bash = new Bash();

/**
 * pelican tasks
**/
module.exports = {
	runSubmissionJob() {
	    bash.runJob(`gentestdata`,
	    `TEST_PROGRAM jnkns TEST_PROJECT jenkins MAX_EXAMPLES 10 SUBMISSION_USER ${user.mainAcct.username}`);
	},
	runETL(){
		// have to make sure that elastic search indices exist
		return bash.runJob(`etl`);
	},
	goToExplorerPage(){
		I.amOnPage(pelicanProps.path);
		portal.seeProp(pelicanProps.exportButton, 10);
		// wait 5 just to make sure the button is active before clicking it
		I.wait(5)
	},
	exportPFB() {
		portal.clickProp(pelicanProps.exportButton);
		portal.seeProp(pelicanProps.exportLink, 60);
	},
};
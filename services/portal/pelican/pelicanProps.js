/**
 * pelican properties
**/

module.exports = {
	path: '/explorer',

	exportButton: {
		locator: {
			xpath: '//button[contains(text(), \'Export to PFB\')]',
	    },
	},

	exportLink: {
		locator:{
			path: '//div[contains(text(), \'Most recent PFB URL:\')]',
		},
	},
};
let chai = require('chai');
let expect = chai.expect;
const I = actor();

const pelicanProps = require('./pelicanProps.js');
const portal = require('../../../utils/portal.js');
const util = require('util');

/**
 * Pelican Questions
 */
module.exports = {
	checkValidPFB(){
		I.waitForText("s3.amazonaws.com/export", 100, Object.values(pelicanProps.exportLink)[0])
	},
};
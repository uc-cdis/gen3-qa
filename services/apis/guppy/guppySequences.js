const chai = require('chai');

const expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

const guppyTasks = require('./guppyTasks.js');
const guppyProps = require('./guppyProps.js');
const { Gen3Response } = require('../../../utils/apiUtil');
const user = require('../../../utils/user.js');
const generalUtils = require('../../../utils/generalUtils.js');
const util = require('util')

const fs = require('fs');

function recordWithSubmitterID(id, arr) {
  for (let i = 0; i < arr.length; i++) {
    if(arr[i]['submitter_id'] == id) {
      return arr[i];
    }
  }
}

function matchAggregation(actualResponse, expectedResponse) {
  expectedResponse = JSON.parse(expectedResponse)['data'];
  actualResponse = actualResponse['data'];
  expect(actualResponse).to.have.own.property('_aggregation');
  expect(actualResponse['_aggregation']).to.have.own.property('case');
  for(var key in expectedResponse['_aggregation']['case']) {
    expect(actualResponse['_aggregation']['case'][key]).to.equal(expectedResponse['_aggregation']['case'][key]);
  }
}

function matchHistogram(actualResponse, expectedResponse) {
  expectedResponse = JSON.parse(expectedResponse)['data'];
  actualResponse = actualResponse['data'];
  
  expect(actualResponse).to.have.own.property('_aggregation');
  expect(actualResponse['_aggregation']).to.have.own.property('case');
  for(var key in expectedResponse['_aggregation']['case']) {
    let expectedHistogramList = expectedResponse['_aggregation']['case'][key]['histogram'];
    expectedHistogramList.sort((a, b) => (a["key"].toString() > b["key"].toString()) ? 1 : -1);

    let actualHistogramList = actualResponse['_aggregation']['case'][key]['histogram'];
    actualHistogramList.sort((a, b) => (a["key"].toString() > b["key"].toString()) ? 1 : -1);

    expect(expectedHistogramList.length).to.equal(actualHistogramList.length);
    for(let k = 0; k < expectedHistogramList.length; k++) {
      expect(generalUtils.objectsAreEquivalent(expectedHistogramList[k], actualHistogramList[k])).to.be.true;
    }    
   }
}

function matchMapping(actualResponse, expectedResponse) {
  expectedResponse = JSON.parse(expectedResponse)['data'];
  actualResponse = actualResponse['data'];
  expect(actualResponse).to.have.own.property('_mapping');
  expect(actualResponse['_mapping']).to.have.own.property('case');
  for(var key in expectedResponse['_mapping']['case']) {
    expect(actualResponse['_mapping']['case'][key]).to.equal(expectedResponse['_mapping']['case'][key]);
  }
}

function matchDataQuery(actualResponse, expectedResponse) {
  expect(actualResponse.length).to.equal(expectedResponse.length);
  for (let i = 0; i < expectedResponse.length; i++) {
    let expectedCaseObj = expectedResponse[i];
    let actualCaseObj = recordWithSubmitterID(expectedResponse[i].submitter_id, actualResponse);
    expect(typeof(expectedCaseObj), 'A matching case was not found for that submitter ID.').to.not.equal('undefined');
    for(var key in expectedCaseObj) {
       console.log(key);
       console.log(expectedCaseObj.submitter_id);
       console.log(actualCaseObj.submitter_id);
       expect(actualCaseObj[key]).to.equal(expectedCaseObj[key]);
     }
  }
}

/**
 * guppy sequences
 */
module.exports = {
  async checkQueryResponseEquals(endpoint, queryToSubmitFilename, expectedResponseFilename, accessToken, queryType) {
    const queryResponse = await guppyTasks.submitQueryFileToGuppy(endpoint, queryToSubmitFilename, accessToken);

    expect(queryResponse.status).to.equal(200);

    let actualResponseJSON = await queryResponse.json();
    let expectedResponse = fs.readFileSync(expectedResponseFilename).toString();
    if(queryType == 'aggregation') {
      return matchAggregation(actualResponseJSON, expectedResponse);
    } else if (queryType == 'histogram') {
      return matchHistogram(actualResponseJSON, expectedResponse);
    } else if (queryType == 'mapping') {
      return matchMapping(actualResponseJSON, expectedResponse);
    } else if (queryType == 'download') {
      expectedResponse = JSON.parse(expectedResponse);
      return matchDataQuery(actualResponseJSON, expectedResponse);
    } else {
      expectedResponse = JSON.parse(expectedResponse)['data']['case'];
      actualResponseJSON = actualResponseJSON['data']['case'];
      return matchDataQuery(actualResponseJSON, expectedResponse);
    }
  },
};
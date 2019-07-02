const chai = require('chai');

const expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

const guppyQuestions = require('./guppyQuestions.js');
const guppyTasks = require('./guppyTasks.js');
const guppyProps = require('./guppyProps.js');
const { Gen3Response } = require('../../../utils/apiUtil');
const user = require('../../../utils/user.js');

const fs = require('fs');

function objectsAreEquivalent(a, b) {
  // http://adripofjavascript.com/blog/drips/object-equality-in-javascript.html
  var aProps = Object.getOwnPropertyNames(a);
  var bProps = Object.getOwnPropertyNames(b);
  if (aProps.length != bProps.length) {
      console.log('22', aProps, ' ' , bProps);
      return false;
  }
  for (var i = 0; i < aProps.length; i++) {
      var propName = aProps[i];
      if (a[propName] !== b[propName]) {
          console.log('28', propName);
          return false;
      }
  }
  return true;
}

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
    expectedHistogramList.sort((a, b) => (a["key"] > b["key"]) ? 1 : -1);

    let actualHistogramList = actualResponse['_aggregation']['case'][key]['histogram'];
    actualHistogramList.sort((a, b) => (a["key"] > b["key"]) ? 1 : -1);

    expect(expectedHistogramList.length).to.equal(actualHistogramList.length);
    for(let k = 0; k < expectedHistogramList.length; k++) {
      expect(objectsAreEquivalent(expectedHistogramList[k], actualHistogramList[k])).to.be.true;
    }    
   }
}

function matchDataQuery(actualResponse, expectedResponse) {
  expectedResponse = JSON.parse(expectedResponse)['data']['case'];
  actualResponse = actualResponse['data']['case'];
  
  expect(actualResponse.length).to.equal(expectedResponse.length);
  for (let i = 0; i < expectedResponse.length; i++) {
    let expectedCaseObj = expectedResponse[i];
    let actualCaseObj = recordWithSubmitterID(expectedResponse[i].submitter_id, actualResponse);
    expect(typeof(expectedCaseObj), 'A matching case was not found for that submitter ID.').to.not.equal('undefined');
    for(var key in expectedCaseObj) {
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
    
    // let msg = await queryResponse.text();
    // console.log('msg: ', msg);

    expect(queryResponse.status).to.equal(200);

    let actualResponseJSON = await queryResponse.json();
    console.log(actualResponseJSON);
    let expectedResponse = fs.readFileSync(expectedResponseFilename).toString();
    // console.log('thing:  ', JSON.parse(expectedResponse));
    if(queryType == 'aggregation') {
      return matchAggregation(actualResponseJSON, expectedResponse);
    } else if (queryType == 'histogram') {
      return matchHistogram(actualResponseJSON, expectedResponse);
    } else {
      return matchDataQuery(actualResponseJSON, expectedResponse);
    }
  },
};
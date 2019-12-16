const chai = require('chai');

const { expect } = chai;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

const util = require('util');
const fs = require('fs');
const guppyTasks = require('./guppyTasks.js');
const guppyProps = require('./guppyProps.js');
const { Gen3Response } = require('../../../utils/apiUtil');
const user = require('../../../utils/user.js');
const generalUtils = require('../../../utils/generalUtils.js');

function recordWithSubmitterID(id, arr) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].submitter_id == id) {
      return arr[i];
    }
  }
}

function matchAggregation(actualResponse, expectedResponse) {
  expectedResponse = JSON.parse(expectedResponse).data;
  actualResponse = actualResponse.data;
  expect(actualResponse).to.have.own.property('_aggregation');
  expect(actualResponse._aggregation).to.have.own.property('case');
  for (const key in expectedResponse._aggregation.case) {
    expect(actualResponse._aggregation.case[key]).to.equal(expectedResponse._aggregation.case[key]);
  }
}

function matchHistogram(actualResponse, expectedResponse) {
  expectedResponse = JSON.parse(expectedResponse).data;
  actualResponse = actualResponse.data;

  expect(actualResponse).to.have.own.property('_aggregation');
  expect(actualResponse._aggregation).to.have.own.property('case');
  for (const key in expectedResponse._aggregation.case) {
    const expectedHistogramList = expectedResponse._aggregation.case[key].histogram;
    expectedHistogramList.sort((a, b) => ((a.key.toString() > b.key.toString()) ? 1 : -1));

    const actualHistogramList = actualResponse._aggregation.case[key].histogram;
    actualHistogramList.sort((a, b) => ((a.key.toString() > b.key.toString()) ? 1 : -1));

    expect(expectedHistogramList.length).to.equal(actualHistogramList.length);
    for (let k = 0; k < expectedHistogramList.length; k++) {
      expect(generalUtils.objectsAreEquivalent(expectedHistogramList[k], actualHistogramList[k])).to.be.true;
    }
  }
}

function matchMapping(actualResponse, expectedResponse) {
  expectedResponse = JSON.parse(expectedResponse).data;
  actualResponse = actualResponse.data;
  expect(actualResponse).to.have.own.property('_mapping');
  expect(actualResponse._mapping).to.have.own.property('case');
  for (const key in expectedResponse._mapping.case) {
    expect(actualResponse._mapping.case[key]).to.equal(expectedResponse._mapping.case[key]);
  }
}

function matchDataQuery(actualResponse, expectedResponse) {
  expect(actualResponse.length).to.equal(expectedResponse.length);
  for (let i = 0; i < expectedResponse.length; i++) {
    const expectedCaseObj = expectedResponse[i];
    const actualCaseObj = recordWithSubmitterID(expectedResponse[i].submitter_id, actualResponse);
    expect(typeof (expectedCaseObj), 'A matching case was not found for that submitter ID.').to.not.equal('undefined');
    for (const key in expectedCaseObj) {
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

    switch (queryType) {
    case 'aggregation':
      return matchAggregation(actualResponseJSON, expectedResponse);
      break;
    case 'histogram':
      return matchHistogram(actualResponseJSON, expectedResponse);
      break;
    case 'mapping':
      return matchMapping(actualResponseJSON, expectedResponse);
      break;
    case 'download':
      expectedResponse = JSON.parse(expectedResponse);
      return matchDataQuery(actualResponseJSON, expectedResponse);
      break;
    default:
      expectedResponse = JSON.parse(expectedResponse).data.case;
      actualResponseJSON = actualResponseJSON.data.case;
      return matchDataQuery(actualResponseJSON, expectedResponse);
    }
  },
};

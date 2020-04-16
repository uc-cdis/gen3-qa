const chai = require('chai');

const { expect } = chai;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

const fs = require('fs');
const guppyTasks = require('./guppyTasks.js');
const generalUtils = require('../../../utils/generalUtils.js');

function recordWithSubmitterID(id, arr) {
  for (let i = 0; i < arr.length; i += 1) {
    if (arr[i].submitter_id === id) {
      return arr[i];
    }
  }
  return null;
}

function matchAggregation(actualResponseFull, expectedResponseStr) {
  const expectedResponse = JSON.parse(expectedResponseStr).data;
  const actualResponse = actualResponseFull.data;
  expect(actualResponse).to.have.own.property('_aggregation');
  expect(actualResponse._aggregation).to.have.own.property('subject');

  const keyList = Object.keys(expectedResponse._aggregation.subject);
  for (let i = 0; i < keyList.length; i += 1) {
    const key = keyList[i];
    expect(actualResponse._aggregation.subject[key]).to.equal(
      expectedResponse._aggregation.subject[key],
    );
  }
}

function matchHistogram(actualResponseFull, expectedResponseStr) {
  const expectedResponse = JSON.parse(expectedResponseStr).data;
  const actualResponse = actualResponseFull.data;

  expect(actualResponse).to.have.own.property('_aggregation');
  expect(actualResponse._aggregation).to.have.own.property('subject');
  const keyList = Object.keys(expectedResponse._aggregation.subject);
  for (let i = 0; i < keyList.length; i += 1) {
    const key = keyList[i];
    const expectedHistogramList = expectedResponse._aggregation.subject[key].histogram;
    expectedHistogramList.sort((a, b) => ((a.key.toString() > b.key.toString()) ? 1 : -1));

    const actualHistogramList = actualResponse._aggregation.subject[key].histogram;
    actualHistogramList.sort((a, b) => ((a.key.toString() > b.key.toString()) ? 1 : -1));

    expect(expectedHistogramList.length).to.equal(actualHistogramList.length);
    for (let k = 0; k < expectedHistogramList.length; k += 1) {
      expect(
        generalUtils.objectsAreEquivalent(expectedHistogramList[k], actualHistogramList[k]),
      ).to.be.true;
    }
  }
}

function matchMapping(actualResponseFull, expectedResponseStr) {
  const expectedResponse = JSON.parse(expectedResponseStr).data;
  const actualResponse = actualResponseFull.data;
  expect(actualResponse).to.have.own.property('_mapping');
  expect(actualResponse._mapping).to.have.own.property('subject');
  const keyList = Object.keys(expectedResponse._mapping.subject);
  for (let i = 0; i < keyList.length; i += 1) {
    const key = keyList[i];
    expect(actualResponse._mapping.subject[key]).to.equal(expectedResponse._mapping.subject[key]);
  }
}

function matchDataQuery(actualResponse, expectedResponse) {
  expect(actualResponse.length).to.equal(expectedResponse.length);
  for (let i = 0; i < expectedResponse.length; i += 1) {
    const expectedCaseObj = expectedResponse[i];
    const actualCaseObj = recordWithSubmitterID(expectedResponse[i].submitter_id, actualResponse);
    expect(typeof (expectedCaseObj), 'A matching subject was not found for that submitter ID.').to.not.equal('undefined');

    const keyList = Object.keys(expectedCaseObj);
    for (let j = 0; j < keyList.length; j += 1) {
      const key = keyList[j];
      expect(actualCaseObj[key]).to.equal(expectedCaseObj[key]);
    }
  }
}

/**
 * guppy sequences
 */
module.exports = {
  async checkQueryResponseEquals(
    endpoint, queryToSubmitFilename, expectedResponseFilename, accessToken, queryType,
  ) {
    const queryResponse = await guppyTasks.submitQueryFileToGuppy(
      endpoint, queryToSubmitFilename, accessToken,
    );

    expect(queryResponse.status).to.equal(200);

    let actualResponseJSON = await queryResponse.json();

    // set GUPPY_FRICKJACK to autogen missing response files
    if (process.env.GUPPY_FRICKJACK === 'true' && !fs.existsSync(expectedResponseFilename)) {
      fs.writeFileSync(expectedResponseFilename, JSON.stringify(actualResponseJSON));
    }
    const expectedResponseStr = fs.readFileSync(expectedResponseFilename).toString();

    switch (queryType) {
    case 'aggregation':
      return matchAggregation(actualResponseJSON, expectedResponseStr);
    case 'histogram':
      return matchHistogram(actualResponseJSON, expectedResponseStr);
    case 'mapping':
      return matchMapping(actualResponseJSON, expectedResponseStr);
    case 'download':
    {
      const expectedResponse = JSON.parse(expectedResponseStr);
      return matchDataQuery(actualResponseJSON, expectedResponse);
    }
    default:
    {
      const expectedResponse = JSON.parse(expectedResponseStr).data.subject;
      actualResponseJSON = actualResponseJSON.data.subject;
      return matchDataQuery(actualResponseJSON, expectedResponse);
    }
    }
  },
};

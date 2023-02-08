const { expect } = require('chai');
const { Gen3Response } = require('./apiUtil');

const TARGET_ENVIRONMENT = process.env.GEN3_COMMONS_HOSTNAME;

function assembleCustomHeaders(ACCESS_TOKEN) {
    // Add ACCESS_TOKEN to custom headers
    return {
      Accept: 'application/json',
      Authorization: `bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    };
  }

async function fetchDIDLists(I, params = { hardcodedAuthz: null }) {
    // assembling the list for the test
    const httpResp = await I.sendGetRequest(
      `https://${TARGET_ENVIRONMENT}/user/user`,
      { Authorization: `bearer ${I.cache.ACCESS_TOKEN}` },
    ).then((res) => new Gen3Response(res));
    // if the hardcodedAuthz is set 
    // checking if the program/project is in the /user/user output
    const foundHardcodedAuthzInResponse = Object.keys(httpResp.data.authz).filter((a) => params.hardcodedAuthz === a).join('');
    console.log(`foundHardcodedAuthzInResponse: ${foundHardcodedAuthzInResponse}`);
    // if hardcodedAuthzx is not mentioned
    if (foundHardcodedAuthzInResponse !== '') {
      projectAccessList = httpResp.data.process_access;
    }

    // initialize dict of accessible DIDs
    let ok200files = {}; // eslint-disable-line prefer-const
    // initialize dict of blocked DIDs
    let unauthorized401files = {}; // eslint-disable-line prefer-const

    // following if the target env is nci-crdc-staging
    const authorized200Project = ['*'];
    for (const i in projectAccessList) { // eslint-disable-line guard-for-in
      authorized200Project.push(i);
    }
    console.log(`Authorized project : ${JSON.stringify(authorized200Project)}`);

    for (const project of authorized200Project) {
      const record200Resp = await I.sendGetRequest(
        `https://${TARGET_ENVIRONMENT}/index/index?acl=${project}&limit=1`,
      );
      if ((record200Resp.data.records.length) === 0) {
        console.log('No Record/DID');
      } else {
        ok200files[record200Resp.data.records[0].did] = {
          urls: record200Resp.data.records[0].urls,
        };
      }
    }

    console.log(`GUID selected: ${I.cache.GUID}`);
    // assemble 401 unauthorized ids
    const record401Resp = await I.sendGetRequest(
      `https://${TARGET_ENVIRONMENT}/index/index/${I.cache.GUID}`,
    );
    unauthorized401files[record401Resp.data.did] = { urls: record401Resp.data.urls };

    console.log(`http 200 files: ${JSON.stringify(ok200files)}`);
    console.log(`http 401 files: ${JSON.stringify(unauthorized401files)}`);

    I.didList = {};
    I.didList.ok200files = ok200files;
    I.didList.unauthorized401files = unauthorized401files;

    return I.didList;
}
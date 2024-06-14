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

async function fetchDIDLists(I, params = { hardcodedAuthz: null }, guid) {
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
      projectAccessList = httpResp.data.authz;
    } else {
      projectAccessList = httpResp.data.project_access;

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
    
    console.log(`GUID selected: ${guid}`);
    // assemble 401 unauthorized ids
    const record401Resp = await I.sendGetRequest(
      `https://${TARGET_ENVIRONMENT}/index/index/${guid}`,
    );
    unauthorized401files[record401Resp.data.did] = { urls: record401Resp.data.urls };

    console.log(`http 200 files: ${JSON.stringify(ok200files)}`);
    console.log(`http 401 files: ${JSON.stringify(unauthorized401files)}`);

    I.didList = {};
    I.didList.ok200files = ok200files;
    I.didList.unauthorized401files = unauthorized401files;

    return I.didList;
  }

function performPreSignedURLTest(cloudProvider, typeOfTest) {
    const filteredDIDs = {};
    if (I.cache.ACCESS_TOKEN) {
      // Obtain project access list to determine which files(DIDs) the user can access
      // two lists: http 200 files and http 401 files
      const { ok200files, unauthorized401files } = await fetchDIDLists(I);

      const listOfDIDs = typeOfTest === 'positive' ? ok200files : unauthorized401files;
      console.log('####');
      console.log(`The Selected List of DIDs : ${JSON.stringify(listOfDIDs)}`);

      // AWS: s3:// | Google: gs://
      const preSignedURLPrefix = cloudProvider === 'AWS S3' ? 's3://' : 'gs://';

      for (const key in listOfDIDs) { // eslint-disable-line guard-for-in
        listOfDIDs[key].urls.forEach((url) => { // eslint-disable-line no-loop-func
          if (url.startsWith(preSignedURLPrefix)) filteredDIDs[key] = url;
        });
      }
    }

    console.log('####');
    console.log(filteredDIDs);

    // selecting random key DID from the list
    const keys = Object.keys(filteredDIDs);
    const selectedDid = keys[Math.floor(Math.random() * keys.length)];
    console.log(`#### Selected DID : ${JSON.stringify(selectedDid)}`);
    // PreSignedURL request
    const signedUrlRes = await fence.do.createSignedUrl(
      `${selectedDid}`,
      [],
      assembleCustomHeaders(I.cache.ACCESS_TOKEN),      
    );
  }
}
Feature('Study Registration @requires-portal @requires-requestor @aggMDS @discoveryPage');

const { expect } = require('chai');
const { Bash } = require('../../utils/bash.js');
const fs = require('fs');
const studyRegistrationProps = require('../../services/portal/studyRegistration/studyRegistrationProps.js');
const studyRegistrationTasks = require('../../services/portal/studyRegistration/studyRegistrationTasks.js');
const requestorTasks = require('../../services/apis/requestor/requestorTasks.js');

const I = actor();
const bash = new Bash();
const filePath = 'test-data/studyRegistrationTest/studyRegistrationData.json';
I.cache = {};
const cedarUUID = process.env.CEDAR_UUID;

AfterSuite (async ({ users, mds }) => {
    // deleting the dummy metadata wih DID
    console.log('Deleting the Study ...');
    try {
        await mds.do.deleteMetadataRecord(users.mainAcct.accessTokenHeader, I.cache.applicationID);
    } catch (err) {
        console.error(err);
    }
    
    await bash.runCommand(`
      gen3 devterm curl -X DELETE arborist-service/user/${users.user2.username}/policy/${I.cache.policyID}
    `);

    // // revoking the request access
    // const requestData = await requestorTasks.getRequestData(users.user2.accessTokenHeader);
    // console.log(requestData);
    // requestData.revoke = true;
    // console.log(requestData);
    // // store policy_id
    // const policy = requestData.policy_id;
    // console.log(policy);
    // const revokePolicy = await requestorTasks.createRequest(requestData);
    // const revokeReqID = revokePolicy.request_id;
    // // move the above request to signed state 
    // await requestorTasks.signedRequest(revokeReqID);
    // expect(revokePolicy.data.authz).to.not.have.property(`${policy}`);
    
    // deleting the request from requestor db
    const deleteRequest = await requestorTasks.deleteRequest(I.cache.requestID);
    if (deleteRequest.status === 200) {
        console.log(`Request ${I.cache.requestID} is deleted successfully`);
    }   
})

Scenario('Register a new study registration', async ({ I, mds, users, home, discovery }) => {
    // create a dummy metadata
    // and storing values for the test in the I.cache
    const studyMetadata = JSON.parse(fs.readFileSync(filePath, { encoding: 'utf8' }));
    // generate random appl_id to the study metadata on every run
    I.cache.applicationID = Math.floor(Math.random() * 90000000) + 10000000;
    studyMetadata.gen3_discovery.appl_id = I.cache.applicationID;
    const projectTitle = studyMetadata.gen3_discovery.project_title;

    // create a metadata record
    await mds.do.createMetadataRecord(
      users.mainAcct.accessTokenHeader, I.cache.applicationID, studyMetadata,
    );

    // run aggMDS sync job
    await mds.do.reSyncAggregateMetadata();
    const record = await studyRegistrationTasks.readUnregisteredMetadata(
        users.mainAcct.accessTokenHeader, I.cache.applicationID,
    );
    expect(record.gen3_discovery.project_title).to.equal(projectTitle);
    
    //step b
    home.do.goToHomepage();
    await home.complete.login(users.user2);
    discovery.do.goToPage();
    I.saveScreenshot('discoveryPage.png');
    
    // request access to register study 
    studyRegistrationTasks.searchStudy(I.cache.applicationID);
    I.click(studyRegistrationProps.requestAccessButton);
    studyRegistrationTasks.fillRequestAccessForm(users.user2.username);
    I.click(studyRegistrationProps.goToDiscoverPageButton);

    // get request ID by sending request to requestor end point
    // requests for user2
    I.cache.requestID = await studyRegistrationTasks.getRequestId(users.user2.accessTokenHeader);
    I.cache.policyID = await requestorTasks.getPolicyID(users.user2.accessTokenHeader); 
    console.log(`### Updating the request ID - ${I.cache.requestID}`);
    await requestorTasks.signedRequest(I.cache.requestID);
    if (process.env.DEBUG === 'true') {
        const status = await requestorTasks.getRequestStatus(I.cache.requestID);
        console.log(`Status of the request is ${status}`);
    }
    I.refreshPage();
    I.wait(5);
    
    discovery.do.goToPage();
    I.saveScreenshot('discoveryPage.png');

    studyRegistrationTasks.searchStudy(I.cache.applicationID);
    studyRegistrationTasks.seeRegisterButton();
    studyRegistrationTasks.fillRegistrationForm(projectTitle, cedarUUID);

    // run aggMDS sync job again after sending CEDAR request
    await mds.do.reSyncAggregateMetadata();
    const linkedRecord = await studyRegistrationTasks.readUnregisteredMetadata(
        users.mainAcct.accessTokenHeader, I.cache.applicationID,
    );
    I.wait(10);
    expect(linkedRecord.gen3_discovery.is_registered).to.be.equal(true);
})
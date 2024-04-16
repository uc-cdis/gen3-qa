Feature('Study Registration @heal @requires-portal @requires-requestor @aggMDS @discoveryPage @requires-metadata');

const { expect } = require('chai');
const fs = require('fs');
const { Bash } = require('../../utils/bash.js');
const bash = new Bash();

const I = actor();
const filePath = 'test-data/studyRegistrationTest/studyRegistrationData.json';
I.cache = {};
const cedarUUID = 'c5891154-750a-4ed7-83b7-7cac3ddddae6';

AfterSuite (async ({ users, fence, requestor, mds }) => {
    // revoking the request access
    const requestData = await requestor.do.getRequestData(users.user2.accessTokenHeader);
    requestData.revoke = true;
    // // store policy_id
    requestData.policyID = requestData.policy_id;
    requestData.adminUserTokenHeader = users.mainAcct.accessTokenHeader;
    if (process.env.DEBUG === 'true') {
        console.log(`### Revoke Request Data: ${requestData}`);
    }
    const revokePolicy = await requestor.do.createRequest(requestData);
    const revokeReqID = revokePolicy.request_id;
    // move the above request to signed state 
    await requestor.do.signedRequest(revokeReqID);
    
    userInfo = await fence.do.getUserInfo(users.user2.accessToken);
    expect(userInfo.data.authz).to.not.have.property(`${I.cache.policy_id}`);

    // deleting the request from requestor db
    const deleteRequest = await requestor.do.deleteRequest(I.cache.requestID);
    if (deleteRequest.status === 200) {
        console.log(`Request ${I.cache.requestID} is deleted successfully`);
    }   
    // delete the above created revoke request 
    await requestor.do.deleteRequest(revokeReqID);

    // deleting the dummy metadata wih DID
    console.log('Deleting the Study ...');
    try {
        await mds.do.deleteMetadataRecord(users.user2.accessTokenHeader, I.cache.applicationID);
    } catch (err) {
        console.error(err);
    }

    // TODO - clean up the CEDAR instance
})

Scenario('Register a new study registration', async ({ I, mds, users, home, discovery, studyRegistration, requestor }) => {
    // dynamically get UID field name from portal config
    const UIDFieldName = bash.runCommand('gen3 secrets decode portal-config gitops.json | jq \'.discoveryConfig.minimalFieldMapping.uid\'').replace(/^"(.*)"$/, '$1');
    expect(UIDFieldName).to.be.a('string').that.is.not.empty;
    // create a dummy metadata
    // and storing values for the test in the I.cache
    const studyMetadata = JSON.parse(fs.readFileSync(filePath, { encoding: 'utf8' }));
    // generate random appl_id to the study metadata on every run
    I.cache.applicationID = Math.floor(Math.random() * 90000000) + 10000000;
    // updating the studyMetadata with values
    studyMetadata.gen3_discovery.appl_id = I.cache.applicationID;
    studyMetadata.gen3_discovery[UIDFieldName] = I.cache.applicationID;
    const projectTitle = studyMetadata.gen3_discovery.project_title;
    const projectNumber = studyMetadata.gen3_discovery.project_number;

    // step 1 : create a dummy metadata record
    // create a metadata record
    await mds.do.createMetadataRecord(
      users.mainAcct.accessTokenHeader, I.cache.applicationID, studyMetadata,
    );
    // put request to add registration_authz
    console.log("Updating metadata record");
    studyMetadata.gen3_discovery.registration_authz = "/study/9675420";
    await mds.do.editMetadataRecord(users.mainAcct.accessTokenHeader, I.cache.applicationID, studyMetadata
    );
    // GET the mds record from mds/metadata endpoint after it is created
    const record = await studyRegistration.do.readMetadata(
        users.mainAcct.accessTokenHeader, I.cache.applicationID,
    );
    expect(record.gen3_discovery.project_title).to.be.equal(projectTitle);
    expect(record._guid_type).to.be.equal("unregistered_discovery_metadata");
    
    // step b
    home.do.goToHomepage();
    await home.complete.login(users.user2);
    discovery.do.goToPage();
    I.saveScreenshot('discoveryPage1.png');
    
    // step 2 : request access to register the study
    // request access to register study by filling the registration form
    studyRegistration.do.searchStudy(I.cache.applicationID);
    I.click(studyRegistration.props.requestAccessButton);
    await studyRegistration.do.fillRequestAccessForm(users.user2.username, projectTitle);
    // I.click(studyRegistration.props.goToDiscoverPageButton);
    // get request ID by sending request to requestor end point
    I.cache.requestID = await studyRegistration.do.getRequestId(users.user2.accessTokenHeader);
    I.cache.policyID = await requestor.do.getPolicyID(users.user2.accessTokenHeader); 
    // updating the request to SIGNED status
    console.log(`### Updating the request ID - ${I.cache.requestID}`);
    await requestor.do.signedRequest(I.cache.requestID);
    if (process.env.DEBUG === 'true') {
        const status = await requestor.do.getRequestStatus(I.cache.requestID);
        console.log(`Status of the request is ${status}`);
    }
    I.refreshPage();
    I.wait(5);

    // step 3 : registration of the study using the CEDAR UUID
    // registration the study
    discovery.do.goToPage();
    I.saveScreenshot('discoveryPage2.png');
    
    studyRegistration.do.searchStudy(I.cache.applicationID);
    studyRegistration.do.seeRegisterButton();
    if (process.env.DEBUG === 'true') {
        console.log(`###CEDAR UUID: ${cedarUUID}`);
    };
    const studyName = `${projectNumber} : ${projectTitle} : ${I.cache.applicationID}`;
    await studyRegistration.do.fillRegistrationForm(cedarUUID, studyName);

    // run aggMDS sync job after sending CEDAR request
    await mds.do.reSyncAggregateMetadata();
    const linkedRecord = await studyRegistration.do.readMetadata(
        users.mainAcct.accessTokenHeader, I.cache.applicationID,
    );

    expect(linkedRecord.gen3_discovery.is_registered).to.be.equal(true);
})

// curl -L https://github.com/uc-cdis/cdis-data-client/releases/latest/download/dataclient_linux.zip -o gen3-client.zip
// unzip -o gen3-client.zip
// # check the version
// ./gen3-client --version

/* eslint-disable max-len */

Feature('Gen3-Client pre-release testing');

const { expect } = require('chai');
const { Bash } = require('../../utils/bash.js');

const bash = new Bash();

BeforeSuite(async ({ I }) => {
  I.cache = {};
  // check
});

// AfterSuite(async ({ I }) => {
//     // delete the index record
//     // delete the profile created via qa-dcp
// })

Scenario('Configure Gen3-Client', async ({ fence, users }) => {
  await bash.runCommand('curl -L https://github.com/uc-cdis/cdis-data-client/releases/latest/download/dataclient_linux.zip -o gen3-client.zip');
  await bash.runCommand('unzip -o gen3-client.zip');
  // checking the gen3-client version
  const gen3ClientVersion = await bash.runCommand('./gen3-client --version');
  console.log(`Gen3-client version: ${gen3ClientVersion}`);

  // create API key for the creds.json
  const apiKey = await fence.do.createAPIKey(
    ['data', 'user'],
    users.mainAcct.accessTokenHeader,
  );
  const keys = {
    api_key: apiKey.data.api_key,
    key_id: apiKey.data.key_id,
  };

  // adding the api key to a cred file
  const credsFile = `./${process.env.NAMESPACE}_creds.json`;
  const stringifiedData = JSON.stringify(keys).replace(/"/g, '\\"');
  await bash.runCommand(`echo "${stringifiedData}" > ${credsFile}`);

  // configure client in gen3-client
  await bash.runCommand(`./gen3-client configure --profile=${process.env.NAMESPACE} --cred=${credsFile} --apiendpoint=https://${process.env.NAMESPACE}.planx-pla.net`);
});

Scenario('Upload via Gen3-client', async ({ I }) => {
  // create a file that can be uploaded
  const fileToBeUploaded = `file_${Date.now()}.txt`;

  // adding content to the file
  await bash.runCommand(`echo "This is a test file" >> ./${fileToBeUploaded}`);

  // upload the file via gen3-client
  const uploadFile = await bash.runCommand(`./gen3-client upload --profile=${process.env.NAMESPACE} --upload-path=./${fileToBeUploaded} 2>&1`);
  const regexToFindGUID = /.*GUID(.*)\..*$/;
  const guid = regexToFindGUID.exec(uploadFile)[1].replace(' ', '');
  I.cache.GUID = guid;

  // checking the index/index/{guid} endpoint
  const indexGUID = await I.sendGetRequest(`https://${process.env.NAMESPACE}.planx-pla.net/index/${guid}`);
  expect(indexGUID.data).to.have.property('file_name', fileToBeUploaded);
});

// Scenario('Download via Gen3-client', async({ I }) => {
//     // download the file
//     const downloadFile = await bash.runCommand(`./gen3-client download-single --profile=${process.env.NAMESPACE} --guid=${I.cache.GUID}`);
//     console.log(downloadFile);
// });

// curl -L https://github.com/uc-cdis/cdis-data-client/releases/latest/download/dataclient_linux.zip -o gen3-client.zip
// unzip -o gen3-client.zip
// # check the version
// ./gen3-client --version

/* eslint-disable max-len */

Feature('Gen3-Client pre-release testing');

const { expect } = require('chai');
const { sleepMS } = require('../../utils/apiUtil.js');
const { Bash } = require('../../utils/bash.js');
const fs = require('fs');

const bash = new Bash();

const I = actor();

// function checkFileExists(filename) {
//   var xhr = new XMLHttpRequest();
//   xhr.open('HEAD', filename, false);
//   xhr.send();

//   if (xhr.status == "404") {
//     console.log('File not found: ' + filename);
//     return false;
//   } else {
//     console.log('File exists: ' + filename);
//     return true;
//   }
// }

BeforeSuite(async ({ I }) => {
  I.cache = {};
  // // check if the profile already exists here it would be the env-name.
  // const profile = await bash.runCommand(`./gen3-client auth --profile=${process.env.NAMESPACE}`);
  // console.log(`Profile = ${profile}`);
  // // If it exists then, delete the profile first and run the test
});

// AfterSuite(async ({ I }) => {
//     // delete the index recordl
//     // delete the profile created via qa-dcp
      // delete the uploaded file from qa-dcp
// })

Scenario('Configure Gen3-Client', async ({ fence, users }) => {
  console.log(__dirname);
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
  const stringfiedKeys = JSON.stringify(apiKey.data).replace(/"/g, '\\"');

  // adding the api key to a cred file
  const credsFile = `./${process.env.NAMESPACE}_creds.json`;
  await bash.runCommand(`echo "${stringfiedKeys}" > ${credsFile}`);

  // configure client in gen3-client
  await bash.runCommand(`./gen3-client configure --profile=${process.env.NAMESPACE} --cred=${credsFile} --apiendpoint=https://${process.env.NAMESPACE}.planx-pla.net`);
});

Scenario('Upload via Gen3-client', async ({ I }) => {
  // create a file that can be uploaded
  const fileToBeUploaded = `file_${Date.now()}.txt`;
  I.cache.FileName = fileToBeUploaded;
  console.log(`Uploading file ${fileToBeUploaded}`);

  // adding content to the file
  await bash.runCommand(`echo "This is a test file" >> ./${fileToBeUploaded}`);

  // upload the file via gen3-client
  const uploadFile = await bash.runCommand(`./gen3-client upload --profile=${process.env.NAMESPACE} --upload-path=./${fileToBeUploaded}`);
  const regexToFindGUID = /.GUID(.*)\..*$/;
  const guid = regexToFindGUID.exec(uploadFile);
  console.log(`guid to find: ${guid}`);
  //.replace(' ', '');
  I.cache.GUID = guid;
  console.log(guid);

  // checking the index/index/{guid} endpoint
  const indexGUID = await I.sendGetRequest(`https://${process.env.NAMESPACE}.planx-pla.net/index/${guid}`);
  expect(indexGUID.data).to.have.property('file_name', fileToBeUploaded);

});

// Scenario('Download via Gen3-client', async({ I }) => {
  
//   await sleepMS(20000);
//   // download the file
//   const downloadFile = await bash.runCommand(`./gen3-client download-single --profile=${process.env.NAMESPACE} --guid=${I.cache.GUID} --no-prompt`);
//   // have a check to see if the file has been download or not
//   const filePath = `./${I.cache.FileName}`;
//   console.dir(filePath);
  
//   // if (fs.existsSync(filePath)) {
//   //   console.log('Download is complete. Path :', filePath);
//   // } else {
//   //   console.log('Download is not complete. Path doesnt exists');
//   // }

//   // fs.accessSync(filePath, fs.W_OK, (err) => {
//   //   if(err) {
//   //     console.log(err, "Download is not complete");
//   //     return;
//   //   }
//   //   console.log("Download is complete. Path :", filePath);
//   // });
//   await bash.runCommand(`touch ${filePath}`);
//   // checkFileExists(filePath);
// });

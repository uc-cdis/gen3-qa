// what does this test do:
// 1. installs gen3-client from source https://github.com/uc-cdis/cdis-data-client#installation
// 2. creates the api key and stores them in the creds.json file - filename 'credsFile'
// 3. using the creds.json, configure the profile
// 4. upload a file
// 5. check the indexd record
// 6. download the file

// this test will run in cdis-data-client and gen3-qa PRs

// to run this locally please ensure golang is installed in the machine (runs on linux and mac)

Feature('Gen3-client @requires-fence @requires-indexd @gen3-client');

const { expect } = require('chai');
const { output } = require('codeceptjs');
const fs = require('fs');
const { execSync } = require('child_process');
const users = require('../../utils/user');
const { sleepMS } = require('../../utils/apiUtil');

const I = actor();
I.cache = {};

BeforeSuite(async ({ I, files}) => {
  I.cache.fileData = 'This is a test file uploaded via gen3-client test';
  const userAccessToken = users.indexingAcct.accessToken;
  I.cache.accessToken = userAccessToken;
  output.debug(`Access token: ${I.cache.accessToken}`);

  // create a file that can be uploaded
  const fileToBeUploaded = `file_${Date.now()}.txt`;
  const filePath = `./${fileToBeUploaded}`;
  console.log(`File to be uploaded : ${fileToBeUploaded}`);
  await files.createTmpFile(filePath, I.cache.fileData);
  I.cache.fileToBeUploaded = fileToBeUploaded;

  // Install gen3-client
  I.cache.goPath = execSync('go env GOPATH', { shell: 'bash' }).toString().trim();
  output.debug(`#### goPath: ${I.cache.goPath}`);
  output.debug(`#### REPO: ${process.env.REPO}`);
  let clientInstallCommands = `mkdir -p ${I.cache.goPath}/src/github.com/uc-cdis` +
      ` && cd ${I.cache.goPath}/src/github.com/uc-cdis` +
      ' && git clone https://github.com/uc-cdis/cdis-data-client.git' +
      ' && mv cdis-data-client gen3-client' +
      ' && cd gen3-client' + 
      ' && go get -d ./...' +
      ' && go install .'
  if(process.env.REPO === 'cdis-data-client' || process.env.REPO === 'gen3-client') {
    output.debug(`#### change branch - ${process.env.CHANGE_BRANCH}`);
    clientInstallCommands = `mkdir -p ${I.cache.goPath}/src/github.com/uc-cdis` +
    ` && cd ${I.cache.goPath}/src/github.com/uc-cdis` +
    ' && git clone https://github.com/uc-cdis/cdis-data-client.git' +
    ' && mv cdis-data-client gen3-client' +
    ' && cd gen3-client' +
    ` && git checkout ${process.env.CHANGE_BRANCH}` +
    ' && go get -d ./...' +
    ' && go install .'
  }

  output.debug(`## clientInstallCommands - ${clientInstallCommands}`)
  execSync(clientInstallCommands, { shell: 'bash' });

  const version = execSync(`${I.cache.goPath}/bin/gen3-client --version`, { shell: 'bash' });
  output.debug(`### gen3-client version installed is ${version}`);
});

AfterSuite(async ({ I, files, indexd }) => {
  // delete the fileUploaded and creds.file
  output.log('Deleting test upload files ...');
  files.deleteFile(I.cache.fileToBeUploaded);
  output.log('Deleting creds.file ...');
  files.deleteFile(I.cache.credsFile);

  // delete indexd record
  output.log('Deleting indexd record ...');
  await indexd.do.deleteFile({ did: I.cache.GUID });
});

Scenario('Upload and download and file with gen3-client', async ({
  I, fence, indexd, files,
}) => {
  const pwd = execSync('pwd', { encoding: 'utf-8', shell: 'bash' });
  output.debug(`#### current working directory: ${pwd.trim()}`);

  // creating a API key
  const scope = ['data', 'user'];
  const apiKey = await fence.do.createAPIKey(
    scope,
    {
      Accept: 'application/json',
      Authorization: `bearer ${I.cache.accessToken}`,
      'Content-Type': 'application/json',
    },
  );
  const data = {
    api_key: apiKey.data.api_key,
    key_id: apiKey.data.key_id,
  };
  const stringifiedKeys = JSON.stringify(data);
  output.debug(`#### Stringified Keys: ${stringifiedKeys}`);

  // adding the api key to a cred file
  const credsFile = `./${process.env.NAMESPACE}_creds.json`;
  await files.createTmpFile(credsFile, stringifiedKeys);
  I.cache.credsFile = credsFile;

  try {
    const credsContent = fs.readFileSync(credsFile, 'utf8');
    output.debug(`Data read from ${credsFile}:`, credsContent);
  } catch (e) {
    output.error('Error reading the file:', e);
  }

  const configureClientCmd = `${I.cache.goPath}/bin/gen3-client configure --profile=${process.env.NAMESPACE} --cred=${credsFile} --apiendpoint=https://${process.env.NAMESPACE}.planx-pla.net`;
  try {
    output.log('Configuring profile ...');
    execSync(configureClientCmd, { shell: 'bash' });
    output.log('### gen3-client profile is configured');
  } catch (error) {
    const msg = error.stdout.toString('utf-8');
    throw new Error(`Error configuring the data client:\n$${msg}`);
  }

  // upload a file via gen3-client
  const uploadFileCmd = `${I.cache.goPath}/bin/gen3-client upload --profile=${process.env.NAMESPACE} --upload-path=${I.cache.fileToBeUploaded} 2>&1`;
  try {
    let cmdOut;
    try {
      console.log('Uploading the file ...');
      cmdOut = execSync(uploadFileCmd, { encoding: 'utf-8', shell: 'bash' });
      console.log(`### ${cmdOut}`);
    } catch (error) {
      throw new Error(error.stdout.toString('utf-8'));
    }
    const guidRegex = cmdOut.match(/to GUID (.*)./);
    if (!guidRegex || guidRegex.length < 2 || guidRegex[1].length < 36) {
      throw new Error(`Did not find a GUID in the command output from gen3-client upload:\n${cmdOut}`);
    }
    const guid = guidRegex[1];
    I.cache.GUID = guid;
  } catch (error) {
    const msg = error.toString('utf8');
    throw new Error(`Error uploading file with data client:\n${msg}`);
  }

  const getIndexdRecord = await I.sendGetRequest(`${indexd.props.endpoints.get}/${I.cache.GUID}`, users.indexingAcct.accessTokenHeader);
  const { rev } = getIndexdRecord.data;
  output.debug(rev);
  output.debug(`${JSON.stringify(getIndexdRecord.data)}`);
  expect(getIndexdRecord.data).to.have.property('urls');

  await sleepMS(10000);

  const downloadPath = `tmpDownloadFile_${Date.now()}`;
  I.cache.downloadFile = downloadPath;
  const downloadFileCmd = `${I.cache.goPath}/bin/gen3-client download-single --profile=${process.env.NAMESPACE} --guid=${I.cache.GUID} --download-path=${downloadPath} --no-prompt`;
  try {
    console.log('Downloading file ...');
    execSync(downloadFileCmd, { shell: 'bash' });
  } catch (error) {
    const msg = error.stdout.toString('utf8');
    throw new Error(`Error downloading file with gen3-client:\n${msg}`);
  }
  // After download check the file exists in the download folder
  if (fs.existsSync(`${downloadPath}/${I.cache.fileToBeUploaded}`)) {
    console.log('File is downloaded successfully');
  } else {
    console.log('File is not downloaded successfully');
  }
  // checking if the file content matches with the original content added
  const fileContent = fs.readFileSync(`${downloadPath}/${I.cache.fileToBeUploaded}`, 'utf8');
  expect(fileContent).to.equal(I.cache.fileData, 'The file content does not match');
});

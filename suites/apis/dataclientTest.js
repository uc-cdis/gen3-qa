/* eslint-disable no-undef */
/* eslint-disable consistent-return */
/* eslint-disable max-len */

// what does this test do:
// 1. downloads the latest gene-client version and unzips in the working directory
// 2. creates the api key and stores them in the creds.json file
// 3. using the creds.json, configure the profile
// 4. upload the file
// 5. check the file is uploaded in indexd
// 6. download the file

Feature('Gen3-Client pre-release testing');

const { expect } = require('chai');
const fs = require('fs');
const { execSync } = require('child_process');
const axios = require('axios');
const AdmZip = require('adm-zip');
const users = require('../../utils/user');
// const os = require('os');

const I = actor();

const latestGen3client = 'https://github.com/uc-cdis/cdis-data-client/releases/latest/download/dataclient_linux.zip';
// const latestGen3client = 'https://github.com/uc-cdis/cdis-data-client/releases/latest/download/dataclient_osx.zip';

// TODO
// // downloading the correct version of the gen3-client zip  as per the architecture it is running on
// if (os.platform === 'darwin') {
//   console.log('Running in macOS, will download latest MACOS version ...');
//   latestGen3client = 'https://github.com/uc-cdis/cdis-data-client/releases/latest/download/dataclient_osx.zip';
// } else if (os.platform === 'linux') {
//   console.log('Running in LINUX, will download latest LINUX version ...');
//   latestGen3client = 'https://github.com/uc-cdis/cdis-data-client/releases/latest/download/dataclient_linux.zip';
// }

const fileData = 'This is a test file uploaded via gen3-client test';

// download the file locally
const download = async (url, path) => {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  fs.writeFileSync(path, response.data);
};
// Unzip the file locally
const unzip = (zipPath, targetPath) => {
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(targetPath, true);
};

// create a new file and write data into it
const writeToFile = async (filePath, dataContent) => {
  const stream = fs.createWriteStream(filePath);
  // eslint-disable-next-line no-unused-vars
  stream.once('open', (fd) => {
    stream.write(dataContent);
    stream.end();
  });
  // now checking if the file is created locally
  if (!fs.existsSync(filePath)) {
    return false;
  }
  console.log(`File ${filePath} exists`);
};

BeforeSuite(async () => {
  I.cache = {};
  const userAccessToken = users.indexingAcct.accessToken;
  I.cache.accessToken = userAccessToken;
  if (process.env.DEBUG === 'true') {
    console.log(`Access token: ${I.cache.accessToken}`);
  }
  // create a file that can be uploaded
  const fileToBeUploaded = `file_${Date.now()}.txt`;
  const filePath = `./${fileToBeUploaded}`;
  console.log(`File to be uploaded : ${fileToBeUploaded}`);
  // adding content to the file
  writeToFile(filePath, fileData);
  I.cache.fileToBeUploaded = fileToBeUploaded;
});

AfterSuite(async ({ indexd }) => {
  // TODO : delete the files from fs

  // delete indexd record
  await indexd.do.deleteFile(I.cache.GUID);
});

Scenario('Configure, Upload and Download via Gen3-client', async ({
  fence, indexd, files,
}) => {
  const pwd = execSync('pwd', { encoding: 'utf-8' });
  console.log('#### current working directory:');
  console.log(pwd.trim());

  console.log('### Downloading latest gen3-client executable file ...');
  // download and unzip the latest gen3-client executable file
  await download(latestGen3client, 'gen3-client.zip')
    .then(() => {
      console.log('File downloaded successfully!');
      unzip('gen3-client.zip', 'gen3-client');
      console.log('File unzipped successfully!');
    })
    .catch((error) => {
      console.error('Error downloading/unzipping file:', error);
    });

  // checking if the gen3-client executable exists in fs after unzipping
  console.log('Looking for data client executable...');
  if (!fs.existsSync('gen3-client/gen3-client')) {
    const msg = 'Did not find a gen3-client executable';
    console.log(`WARNING: ${msg}`);
  } else {
    console.log('Found a gen3-client executable...');
    // changing the permission on gen3c-client
    // if you dont change the permissions, you will get permission denied
    console.log('Changing the permission on gen3-client executable ...');
    const desiredMode = 0o765;
    fs.chmodSync('gen3-client/gen3-client', desiredMode, (err) => {
      console.log('### All good updating permissions');
      if (err) {
        console.error('Error updating permissions:', err);
      }
    });
    console.log('Checking for executable permissions ');
    fs.accessSync('./gen3-client/gen3-client', fs.constants.X_OK, (err) => {
      console.log('### gen3-client is executable.');
      if (err) {
        console.error('### gen3-client is not executable.');
      }
    });
    // check the gen3-client version
    const checkVersionCmd1 = './gen3-client/gen3-client --version';
    try {
      const version = execSync(checkVersionCmd1);
      console.log(`### bash : ${version}`);
    } catch (error) {
      const msg = error.stdout.toString('utf8');
      console.log(`ERROR: ${msg}`);
    }
  }

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
  const stringifiedKeys = JSON.stringify(data).replace(/\*\*\*\*/g, '{');
  if (process.env.DEBUG === 'true') {
    console.log(`#### Stringified Keys: ${stringifiedKeys}`);
  }
  // // adding the api key to a cred file
  const credsFile = `./${process.env.NAMESPACE}_creds.json`;
  try {
    fs.writeFileSync(credsFile, stringifiedKeys);
    console.log('File created and data written successfully');
  } catch (e) {
    console.error('Error writing the file:', e);
  }

  try {
    const fileContent = fs.readFileSync(credsFile, 'utf8');
    console.log(`Data read from ${credsFile}:`, fileContent);
  } catch (e) {
    console.error('Error reading the file:', e);
  }

  const configureClientCmd = `./gen3-client/gen3-client configure --profile=${process.env.NAMESPACE} --cred=${credsFile} --apiendpoint=https://${process.env.NAMESPACE}.planx-pla.net`;
  try {
    console.log('Configuring profile ...');
    execSync(configureClientCmd);
    console.log('### gen3-client profile is configured');
  } catch (error) {
    const msg = error.stdout.toString('utf-8');
    throw new Error(`Error configuring the data client:\n$${msg}`);
  }

  files.deleteFile(credsFile);

  // upload a file via gen3-client
  const uploadFileCmd = `./gen3-client/gen3-client upload --profile=${process.env.NAMESPACE} --upload-path=${I.cache.fileToBeUploaded} 2>&1`;
  try {
    let cmdOut;
    try {
      console.log('Uploading the file ...');
      cmdOut = execSync(uploadFileCmd, { encoding: 'utf-8' });
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
  if (process.env.DEBUG === 'true') {
    console.log(rev);
    console.log(getIndexdRecord.data);
  }
  expect(getIndexdRecord.data).to.have.property('urls');

  execSync('sleep 10');
  const downloadPath = `tmpDownloadFile_${Date.now()}.txt`;
  const downloadFileCmd = `./gen3-client/gen3-client download-single --profile=${process.env.NAMESPACE} --guid=${I.cache.GUID} --download-path=${downloadPath} --no-prompt`;
  try {
    console.log('Downloading file ...');
    execSync(downloadFileCmd);
  } catch (error) {
    const msg = error.stdout.toString('utf8');
    throw new Error(`Error downloading file with gen3-client:\n${msg}`);
  }
  // After download check the file exists in the download folder and also check if the content matches
  if (fs.existsSync(`${downloadPath}/${I.cache.fileToBeUploaded}`)) {
    console.log('File is downloaded successfully');
  } else {
    console.log('File is not downloaded successfully');
  }
});

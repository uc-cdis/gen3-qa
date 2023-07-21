// to run this test, you need to download and install the latest version of gen3-client
// curl -L https://github.com/uc-cdis/cdis-data-client/releases/latest/download/dataclient_linux.zip -o gen3-client.zip
// unzip -o gen3-client.zip


// Files created during the test
// 1. temp creds file
// 2. file to be uploaded
// 3. indexd record for the uploaded file
// 4. temp downloaded file


/* eslint-disable max-len */

Feature('Gen3-Client pre-release testing');

const { expect } = require('chai');
const fs = require('fs');
const { execSync } = require('child_process');
const axios = require('axios');
const AdmZip = require('adm-zip');

const I = actor();
const latest_gen3client = 'https://github.com/uc-cdis/cdis-data-client/releases/latest/download/dataclient_linux.zip';

let fileToBeUploaded; let fileSize=10; let fileMd5='bdc147c6d08bf120f246609bc5f4632d';
const fileData = "This is a test file uploaded via gen3-client test";
let urls = [ 's3://qa-dcp-databucket-gen3/testdata' ];

//download the file locally
const download =  async(url, path) => {
  const response = await axios.get(url, { responseType: 'arraybuffer'});
  fs.writeFileSync(path, response.data);
};
// Unzip the file locally
const unzip = (zipPath, targetPath) => {
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(targetPath, true);
};

// create a new file and write data into it
const writeToFile = async(filePath, dataContent) => {
  const stream = fs.createWriteStream(filePath);
  stream.once('open', (fd) => {
    stream.write(dataContent);
    stream.end();
  });
  // now checking if the file is created locally
  if (!fs.existsSync(filePath)) {
      return false;
  } else {
    console.log(`File ${filePath} exists`);
  }
};

BeforeSuite(async ({ I }) => {
  I.cache = {};

  // create a file that can be uploaded
  // add fileData to the file
  fileToBeUploaded = `file_${Date.now()}.txt`;
  filePath = `./${fileToBeUploaded}`;
  console.log(`File to be uploaded : ${fileToBeUploaded}`);
  // adding content to the file
  writeToFile(filePath, fileData);
});

// AfterSuite(async ({ I, files, indexd }) => {
//     // delete the uploaded file from qa-dcp
//     files.deleteFile(filePath);

//     // delete indexd record
//     await indexd.do.deleteFile(I.cache.GUID);
// });

Scenario('Configure, Upload and Download via Gen3-client', async ({ I, fence, users, indexd, files }) => {
  
  // TODO: figure out how to download latest version in automated script
  
  const pwd = execSync('pwd', { encoding: 'utf-8' });
  console.log(pwd.trim());

  console.log('### Downloading latest gen3-client executable file ...');
  // download and unzip the latest gen3-client executable file
  await download(latest_gen3client, 'gen3-client.zip')
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
  if (!fs.existsSync('gen3-client')) {
    const msg = `Did not find a gen3-client executable`;
    console.log(`WARNING: ${msg}`);
  } else {
    console.log('Found a gen3-client executable...')
    // check the gen3-client version
    checkVersionCmd = 'gen3-client --version';
    try {
      const version = execSync(checkVersionCmd);
      console.log(`### ${version}`);
    } catch (error) {
      const msg = error.stdout.toString('utf8');
      console.log(`ERROR: ${msg}`);
    }
  }
  
  // creating a API key
  const apiKey = await fence.do.createAPIKey(
    ['data', 'user'],
    users.indexingAcct.accessTokenHeader,
  );
  const data = {
    api_key: apiKey.data.api_key,
    key_id: apiKey.data.key_id,
  };
  const stringifiedKeys = JSON.stringify(data);
  console.log(`##${stringifiedKeys}`);
  // // adding the api key to a cred file
  const credsFile = `./${process.env.NAMESPACE}_creds.json`;
  await writeToFile(credsFile, stringifiedKeys);
  fs.readFileSync(credsFile, 'utf8', (error, data) => {
    if (error) {
      console.error('Error reading the file:', error);
    } else {
      console.log('File contents:', data);
    }
  });
  

  const configureClientCmd = `gen3-client configure --profile=${process.env.NAMESPACE} --cred=${credsFile} --apiendpoint=https://${process.env.NAMESPACE}.planx-pla.net`;
  try {
    execSync(configureClientCmd);
    console.log('### gen3-client profile is configured');
  } catch (error) {
    const msg = error.stdout.toString('utf-8');
    throw new Error(`Error configuring the data client:\n$${msg}`);
  }
  
  files.deleteFile(credsFile);

  // upload a file via gen3-client
  const uploadFileCmd = `gen3-client upload --profile=${process.env.NAMESPACE} --upload-path=${fileToBeUploaded} 2>&1`;
  try {
    let cmdOut;
    try {
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
  
  const addFields = {
    // hashes: {
    //   "md5sum": "bdc147c6d08bf120f246609bc5f4632d" 
    // },
    // size: 10,
    urls: [ "s3://qa-dcp-databucket-gen3/testdata" ],  
  };

  // indexd.do.updateFile(I.cache.GUID, fileNode, users.indexingAcct.accessTokenHeader);
  const getIndexdRecord = await I.sendGetRequest(`${indexd.props.endpoints.get}/${I.cache.GUID}`, users.indexingAcct.accessTokenHeader);
  const rev = getIndexdRecord.data.rev;
  if (process.env.DEBUG === 'true') {
    console.log(rev);
  }

  const updateRecord = await I.sendPutRequest(
    `${indexd.props.endpoints.put}/${I.cache.GUID}?rev=${rev}`,
    addFields,
    users.indexingAcct.accessTokenHeader,
  )
  expect(updateRecord.data).to.have.property('urls');
  indexd.complete.checkRecordExists();

  const downloadPath= './tmpDownloadFile.txt';
  const downloadFileCmd = `gen3-client download-single --profile=${process.env.NAMESPACE} --guid=${I.cache.GUID} --file=${downloadPath}`;
  try {
    execSync(downloadFileCmd);
  } catch(error) {
    const msg = error.stdout.toString('utf8');
    throw new Error(`Error downloading file with gen3-client:\n${msg}`);
  }
});

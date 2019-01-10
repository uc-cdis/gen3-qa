const fs = require("fs");
const { execSync } = require('child_process');

const dataClientProps = require('./dataClientProps.js');

const I = actor();
const homedir = require('os').homedir();

/**
 * dataClient Tasks
 */
module.exports = {
  /**
   * Configure the gen3 client
   */
  async configureClient(fence, users, files) {
    try {

      // create a creds file
      const scope = ['data', 'user'];
      const apiKeyRes = await fence.do.createAPIKey(
        scope,
        users.mainAcct.accessTokenHeader,
      );
      let data = {
        api_key: apiKeyRes['body']['api_key'],
        key_id: apiKeyRes['body']['key_id'],
      };
      const credsPath = './tmp_creds.json';
      await files.createTmpFile(credsPath, JSON.stringify(data));

      // configure the gen3 client
      let apiEndpoint = `https://${process.env.HOSTNAME}`;
      let configComd = `${homedir}/gen3-client configure --profile ${dataClientProps.profileName} --cred ${credsPath} --apiendpoint ${apiEndpoint}`;
      execSync(configComd, (error, stdout, stderr) => {
        if (error !== null) {
            console.log(`exec error: ${error}`);
        }
      });

      // delete the creds files
      files.deleteFile(credsPath);

      } catch (e) {
        let msg = e.stderr.toString('utf8');
        throw new Error('Error configuring the data client:\n' + msg);
      }
  },

  /**
   * Upload a file
   * @param {string} filePath - file location
   */
  async uploadFile(filePath) {
    let uploadCmd = `${homedir}/gen3-client upload --profile=${dataClientProps.profileName} --upload-path=${filePath}`;
    try {
      let out = execSync(uploadCmd).toString('utf8');
      // parse the output to find the file's new GUID
      var matches = out.match(/to GUID (.*)./);
      if (matches.length < 2 || matches[1].length != 36) {
        throw new Error('Did not find a GUID in the following output from the gen3-client:\n' + out)
      }
      return matches[1];
    }
    catch(e) {
      let msg = e.toString('utf8');
      throw new Error('Error uploading file with the data client:\n' + msg);
    }
  },

  /**
   * Download a file
   * @param {string} guid - GUID of the file to download
   * @param {string} filePath - location to store the file
   */
  async downloadFile(guid, filePath) {
    let downloadCmd = `${homedir}/gen3-client download --profile=${dataClientProps.profileName} --guid=${guid} --file=${filePath}`;
    try {
      out = execSync(downloadCmd);
    }
    catch(e) {
      let msg = e.stderr.toString('utf8');
      throw new Error('Error downloading file with the data client:\n' + msg);
    }
  },
};

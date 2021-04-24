const fs = require('fs');
const { execSync } = require('child_process');

const dataClientProps = require('./dataClientProps.js');

const I = actor();
const client_dir = process.env.DATA_CLIENT_PATH || require('os').homedir();

/**
 * dataClient Tasks
 */
module.exports = {
  /**
   * Configure the gen3 client
   */
  async configureClient(fence, users, files) {
    // create a creds file
    const credsPath = './tmp_creds.json';
    const scope = ['data', 'user'];
    const apiKeyRes = await fence.do.createAPIKey(
      scope,
      users.mainAcct.accessTokenHeader,
    );
    const data = {
      api_key: apiKeyRes.body.api_key,
      key_id: apiKeyRes.body.key_id,
    };
    await files.createTmpFile(credsPath, JSON.stringify(data));

    // configure the gen3 client
    const apiEndpoint = `https://${process.env.HOSTNAME}`;
    const configComd = `${client_dir}/gen3-client configure --profile ${dataClientProps.profileName} --cred ${credsPath} --apiendpoint ${apiEndpoint}`;

    try {
      execSync(configComd);
    } catch (e) {
      const msg = e.stdout.toString('utf8');
      throw new Error(`Error configuring the data client:\n${msg}`);
    }

    // delete the creds files
    files.deleteFile(credsPath);
  },

  /**
   * Upload a file
   * @param {string} filePath - file location
   */
  async uploadFile(filePath) {
    const uploadCmd = `${client_dir}/gen3-client upload --profile=${dataClientProps.profileName} --upload-path=${filePath}`;
    try {
      let out;
      try {
        out = execSync(uploadCmd).toString('utf8');
      } catch (e) {
        throw new Error(e.stdout.toString('utf8'));
      }
      // parse the output to find the file's new GUID
      const matches = out.match(/to GUID (.*)./);
      if (!matches || matches.length < 2 || matches[1].length < 36) {
        throw new Error(`Did not find a GUID in the following output from the gen3-client:\n${out}`);
      }
      return matches[1];
    } catch (e) {
      const msg = e.toString('utf8');
      throw new Error(`Error uploading file with the data client:\n${msg}`);
    }
  },

  /**
   * Download a file
   * @param {string} guid - GUID of the file to download
   * @param {string} filePath - location to store the file
   */
  async downloadFile(guid, filePath) {
    const downloadCmd = `${client_dir}/gen3-client download --profile=${dataClientProps.profileName} --guid=${guid} --file=${filePath}`;
    try {
      execSync(downloadCmd);
    } catch (e) {
      const msg = e.stdout.toString('utf8');
      throw new Error(`Error downloading file with the data client:\n${msg}`);
    }
  },
};

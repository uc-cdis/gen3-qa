const fs = require("fs");
const { execSync } = require('child_process');

const dataClientProps = require('./dataClientProps.js');
const usersUtil = require('../../../utils/usersUtil.js');

const I = actor();
const homedir = require('os').homedir();

/**
 * dataClient Tasks
 */
module.exports = {
  /**
   * Overwrite the gen3-client config file. This should append to the current config after checking that the profile_name does not already exist, but it would duplicate the gen3-client code -> maybe we can change the gen3-client to accept the api endpoint as a param to configure?
   */
  async configure_client(fence, users, profileName) {
    const scope = ['data', 'user'];
    const apiKeyRes = await fence.do.createAPIKey(
      scope,
      users.mainAcct.accessTokenHeader,
    );
    apiKey = apiKeyRes['body']['api_key'];
    keyId = apiKeyRes['body']['key_id'];
    apiEndpoint = `https://${process.env.HOSTNAME}`;
    configPath = `${homedir}/.gen3/config`;

    var stream = fs.createWriteStream(configPath); //, {'flags': 'a'});
    stream.once('open', function(fd) {
      stream.write("[" + profileName + "]\n");
      stream.write("key_id=" + keyId + "\n");
      stream.write("api_key=" + apiKey + "\n");
      stream.write("access_key=\n");
      stream.write("api_endpoint=" + apiEndpoint + "\n\n");
      stream.end();
    });
  },

  /**
   * TODO: this should return a GUID
   */
  async upload_file(profileName, filePath) {
    let uploadCmd = `${homedir}/gen3-client upload-new --profile ${profileName} --file=${filePath}`;
    out = execSync(uploadCmd).catch((e) => console.log(e));
    // console.log(out.toString('utf8'));
    resGuid = 'xxx';
    return resGuid;
  },

  /**
   *
   */
  async download_file(profileName, guid, fileName) {
    let downloadCmd = `${homedir}/gen3-client download --profile ${profileName} --guid ${guid} --file=${fileName}`;
    out = execSync(`${downloadCmd}`);
    // console.log(out.toString('utf8'));
    // if (out.includes('panic:')) {
    //   throw new Error(out)
    // }
  },
};

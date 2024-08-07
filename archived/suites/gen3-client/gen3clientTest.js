Feature('Gen3-dataclient');

const chai = require('chai');
const { interactive, ifInteractive } = require('../../../utils/interactive.js');

const { expect } = chai;
const hostname = process.env.HOSTNAME;

// Installation
Scenario('Install gen3-client @manual', ifInteractive(
  async () => {
    const result = await interactive(`
            1. Download the newest version of gen3-client from github repo - https://github.com/uc-cdis/cdis-data-client/releases/tag/{latest-tag}
            2. Unzip the download and add the executable to directory, ~/.gen3/gen3-client.exe
            3. on terminal, echo 'export PATH=$PATH:~/.gen3' >> ~/.bash_profile or ~/.zshrc       
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// configuration
Scenario('Configure gen3-client @manual', ifInteractive(
  async () => {
    const result = await interactive(`
            1. go to the dedicated user's data commons you need your gen3-client configured with
            2. Login and go to Profile tab
            3. 'Create a API key' and download the json, downloaded as 'credential.json'
            4. use gen3-client configure command - gen3-client configure --profile=<profile_name> --cred=<credentials.json> --apiendpoint=<api_endpoint_url>
                where --cred is full path to 'credentials.json' and --apiendpoint is the datacommons.org
                example : 
                gen3-client configure --profile=bob --cred=/Users/Bob/Downloads/credentials.json --apiendpoint=https://data.mycommons.org
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// misconfiguration error checker
Scenario('Wrong API key correct apiendpoint @manual', ifInteractive(
  async () => {
    const result = await interactive(`
            1. user has a wrong cred.json (API key) and correct API endpoint
            2. the misconfiguration checker displays a message Invalid credentials for apiendpoint '<apiendpoint>': check if your credentials are expired or incorrect  
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('correct API key wrong apiendpoint @manual', ifInteractive(
  async () => {
    const result = await interactive(`
            1. user has a correct cred.json (API key) but wrong API endpoint
            2. the misconfiguration checker displays a message 'The provided apiendpoint '<apiendpoint>' is possibly not a valid Gen3 data commons' 
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// version checker
Scenario('Version Checker error @manual', ifInteractive(
  async () => {
    const result = await interactive(`
            1. After the successful installation and configuration of profile, user can use gen3-client command on terminal console
            2. the version checker will show 'A new version of gen3-client is avaliable! The latest version is <LATEST_VERSION>. You are using version <CURRENT_VERSION>
            Please download the latest gen3-client release from https://github.com/uc-cdis/cdis-data-client/releases/latest' message on the console if a newer version of gen3-client is available

            Note : This test can be done only locally currently as there are no versions for gen3-client. To carry out the test locally, follow this https://github.com/uc-cdis/cdis-data-client#installation and make a version change in 'gitversion' on path gen3-client/g3cmd/gitversion.go
            After the changes are made, run command 'go install .' and run any gen3-client command to see the response. 
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// file-upload
Scenario('Create a folder and generate a test file @manual', ifInteractive(
  async () => {
    const result = await interactive(`
            1. Create a new directory called "test_upload"
            2. Go to directory /test_upload
            3. Create a new file (echo "gen3 test" > test.txt)
            4. Generate a sha256 hash of the test file and take note of the value
               (Linux: cat test.txt | sha256sum)
               (OSX: shasum -a 256 test.txt)
               e.g., % shasum -a 256 test.txt
                     d3b79a56c5641cc2e44f3067fba5410684df8fbb287c42a5d25496d19c736e33  test.txt
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// The test assumes the presence of a valid profile configuration
// in ~/.gen3/config (containing api-key, JWT token and api endpoint)
Scenario('Run the gen3-client CLI utility and upload the test file to <profile> @manual', ifInteractive(
  async () => {
    const result = await interactive(`
            1. Run the gen3-cli upload command and store the output in a log file: gen3-client upload --profile=<profile> --upload-path=test.txt | tee upload.log
            2. Take note of the GUID that is printed as part of the output
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('Download the same test file and verify integrity @manual', ifInteractive(
  async () => {
    const result = await interactive(`
            1. Run the gen3-cli download command: gen3-client download-single --profile=<profile> --guid=<GUID from the previous scenario>
            2. Generate a sha256 hash of the file that was downloaded (see instructions from the first scenario)
            3. Run a diff command against the hashes to check if both files have the same hash (i.e., confirming integrity of the file by comparing the hash values).
               diff uploaded-file-sha256 downloaded-file-sha256
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('Try the download-multiple feature @manual', ifInteractive(
  async () => {
    const result = await interactive(`
            1. This scenario assumes the presence of uploaded files that have been ETL'ed. The manifest containing the files metadata should be found under the Files (or Downloadable) tab in the Explorer page. Click on the "Download Manifest" button to save the json file to your disk.
            2. Run the gen3-cli download-multiple command: gen3-client download-multiple --profile=<profile> --manifest=<path_to_the_manifest_json_file>
            3. Make sure the download-multiple operation is completed successfully and all files are downloaded.
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// clean-up
Scenario('Delete file from the commons system and also from local disk @manual', ifInteractive(
  async () => {
    const accessTokenPlaceholderString = '{ACCESS_TOKEN}';
    const result = await interactive(`
            1. Login to the target environment's web interface and take note of the value of the "access_token" cookie
            2. Store the access token in an environment variable (export ACCESS_TOKEN=<ACCESS_TOKEN>)
            2. Run the following curl command to produce an HTTP DELETE request to remove all references of the test file from the system. Make sure you provide the same GUID correspondent to the test file that has been used in previous scenarios. The HTTP Response Code must be 2xx (not 5xx).
               curl -L -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $${accessTokenPlaceholderString}" -X DELETE https://${hostname}/user/data/<GUID>
            3. Delete the test file from the local disk (rm test.txt)
            4. Repeat the same steps for the 2nd test file.
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

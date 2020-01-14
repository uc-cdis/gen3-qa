Feature('Brain Promotion Smoke Test Suite');

const { expect } = require('chai');
const { interactive, ifInteractive } = require('../../utils/interactive.js');

// @toBeAutomated
Scenario('Login with Synapse first time @manual @dream', ifInteractive(
  async () => {
    const result = await interactive(`
            Note: execute this test, if the user is logging in with Syanpse account for the first time.
            1. Go to https://gen3qa.braincommons.org/
            2. Login with BEAT-PD button (with correct credentials and incorrect credentials)
            3. the user is redirected to Synapse site, click on 'Allow' which redirects to https://gen3qa.braincommons.org/
            4. After being re-directed, there is a 'Terms of Use and Privacy Policy' pop-up on https://gen3qa.braincommons.org/ 
            5. the user have to hit 'Agree' two times to get through to the data commons
            6. Log out of Synapse account
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('Login with Synapse @manual @dream', ifInteractive(
  async () => {
    const result = await interactive(`
            1. Go to https://gen3qa.braincommons.org/
            2. Login with BEAT-PD button (with correct credentials and incorrect credentials)
            3. the user is redirected to Synapse site, click on 'Allow' which redirects to https://gen3qa.braincommons.org/
            4. After being re-directed to the https://gen3qa.braincommons.org/, the user is logged in with the Synapse login email id
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('Exploration Page @manual @core', ifInteractive(
  async () => {
    const result = await interactive(`
            1. Navigate to Exploraton tab, the page loads with facet search tab on the left and statistic graphs, aggregated total of project and cases and project table
            2. Click on Data/File tabs on the Exploration Page, see if there is a change on the graphs and project/file table
            3. Make selection in the facet search options, see if there are any changes in the graphs and project/file table
            4. Click on the 'DownloadData' and 'DownloadManifest' button, see if the selected cohort is downloaded 
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('Profile Page @manual @core', ifInteractive(
  async () => {
    const result = await interactive(`
            1. Click on Profile Tab on the top bar
            2. the user sees 'Create API key' button and table with resource permissions
            3. user clicks on 'Create API key' button and pop-up with API key created for the user
            4. user can download the 'credential.json' to carry out various other test execution against https://gen3qa.braincommons.org/
            5. the user is able see the project access table with right permissions to the right projects
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('Install gen3-client @manual @core', ifInteractive(
  async () => {
    const result = await interactive(`
            1. Download the newest version of gen3-client from github repo - https://github.com/uc-cdis/cdis-data-client/releases/tag/{latest-tag} (the user should make sure that downloaded version of gen3-client is appropriate platform (Windows/Mac))
            2. Unzip the download and add the executable to user's directory
            3. on terminal, echo 'export PATH=$PATH:<path>' >> ~/.bash_profile or ~/.zshrc  
            4. now run 'gen3-client' command on terminal. The user should see the version no and also list of available commands     
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// wrong binary (windows) on mac platform
Scenario('Installing the wrong binary file gen3-client @manual @core', ifInteractive(
  async () => {
    const result = await interactive(`
            1. the user downloads binary file for Windows and tries to execute the file on Mac
            2. the user would see error message such as this '-bash: ./gen3-client.exe: cannot execute binary file'
            3. Now user executes the correct binary file and executes gen3-client command. 
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// version checker
Scenario('Version Checker error @manual @core', ifInteractive(
  async () => {
    const result = await interactive(`
            1. After the successful installation and configuration of profile, user can use gen3-client command on terminal console
            2. the version checker will show 'A new version of gen3-client is avaliable! The latest version is LATEST_VERSION. You are using version CURRENT_VERSION'
            Please download the latest gen3-client release from https://github.com/uc-cdis/cdis-data-client/releases/latest' message on the console if a newer version of gen3-client is available

            Note : This test can be done only locally currently as there are no versions for gen3-client. To carry out the test locally, follow this https://github.com/uc-cdis/cdis-data-client#installation and make a version change in 'gitversion' on path gen3-client/g3cmd/gitversion.go
            After the changes are made, run command 'go install .' and run any gen3-client command to see the response. 
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('Configuring gen3-client @manual @core', ifInteractive(
  async () => {
    const result = await interactive(`
            1. go to the dedicated user's data commons you need your gen3-client configured with
            2. Login and go to Profile tab
            3. 'Create a API key' and download the json, downloaded as 'credential.json'
            4. to configure use gen3-client configure command - gen3-client configure --profile=<profile_name> --cred=<credentials.json> --apiendpoint=<api_endpoint_url>
                where --cred is full path to 'credentials.json' and --apiendpoint is the datacommons.org
                example : 
                gen3-client configure --profile=bob --cred=/Users/Bob/Downloads/credentials.json --apiendpoint=https://data.mycommons.org
            5. go to ~/.gen3/config and check if the profile was created for the user. Also check if the API key is the same as used while configuring the profile
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// misconfiguration error checker
Scenario('Wrong API key correct apiendpoint @manual @core', ifInteractive(
  async (I) => {
    const result = await interactive(`
            1. user has a wrong cred.json (API key) and correct API endpoint
            2. the misconfiguration checker displays a message Invalid credentials for apiendpoint '<apiendpoint>': check if your credentials are expired or incorrect  
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('correct API key wrong apiendpoint @manual @core', ifInteractive(
  async () => {
    const result = await interactive(`
            1. user has a correct cred.json (API key) but wrong API endpoint
            2. the misconfiguration checker displays a message 'The provided apiendpoint '<apiendpoint>' is possibly not a valid Gen3 data commons' 
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// download using a smaller manifest
Scenario('Download multiple files using smaller manifest @manual @core', ifInteractive(
  async () => {
    const result = await interactive(`
            1. The user should login and navigate to the Exploration page
            2. select a small cohort of files and click on 'Download Manifest' button. 'manifest.json' file is downloaded.
            3. on terminal, 'gen3-client download-multiple --profile=<YOUR_PROFILE_NAME> --manifest=<manifest_file> --download-path=<path_for_files>' 
            4. if successful, the user would see message - '<no> files downloaded'
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// download using a larger manifest
Scenario('Download multiple files using larger manifest @manual @core', ifInteractive(
  async () => {
    const result = await interactive(`
            1. The user should login and navigate to the Exploration page
            2. select a 250GB cohort of files and click on 'Download Manifest' button. 'manifest.json' file is downloaded.
            3. on terminal, 'gen3-client download-multiple --profile=<YOUR_PROFILE_NAME> --manifest=<manifest_file> --download-path=<path_for_files>' 
            4. if successful, the user would see message - '<no> files downloaded'
            5. Test Variations - try to download with the wrong manifest
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// download a single file
Scenario('Download a single file with GUID @manual @core', ifInteractive(
  async () => {
    const result = await interactive(`
            1. Login to the commons using Syanpse login credentials. Get <GUID> that you want to download via indexd endpoint '/index/index' 
            2. on terminal, use gen3-client command - 'gen3-client download-single --profile=<YOUR_PROFILE_NAME> --guid=<GUID>'
            3. user should see a message 'Successfully downloaded <filename>' after successful download
            4. on terminal, execute 'gen3-client download-single --profile=<YOUR_PROFILE_NAME> --guid=<VALID GUID> --download-path=<path>'
            5. testing variation -> user can try downloading the file with wrong download path and via wrong profile
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('Download a single file with file format @manual @core', ifInteractive(
  async () => {
    const result = await interactive(`
            1. Get <GUID> from indexd endpoint that you want to download
            2. on terminal, use gen3-client command - 'gen3-client download-single --profile=<YOUR_PROFILE_NAME> --guid=<GUID> --filename-format=<filename-format>'
            3. the content of <GUID> is downloaded in the particular file format the user wants
            4. on terminal, execute 'gen3-client download-single --profile=<YOUR_PROFILE_NAME> --guid=<VALID GUID> --download-path=<path> --filename-format=<filename-format>'
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('Upload a single file @manual @core', ifInteractive(
  async () => {
    const result = await interactive(`
            1. Create a file which the user wants to upload using gen3-client
            2. on terminal, execute - 'gen3-client upload --profile=<YOUR_PROFILE> --upload-path=test_upload.txt'
            3. After the successful upload, you will see <GUID> generated for the file uploaded. 
            4. the user can try to download the file using the <GUID> to verify that the upload was successful.
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

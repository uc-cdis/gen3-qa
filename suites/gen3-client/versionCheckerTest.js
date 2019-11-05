Feature('Gen3-client Version Checker - https://ctds-planx.atlassian.net/browse/PXP-4571 ')

const chai = require('chai');
const {interactive, ifInteractive} = require('../../utils/interactive.js');
const expect = chai.expect;
const hostname = process.env.HOSTNAME;
const profile = process.env.NAMESPACE;

Scenario('Install gen3-client @manual', ifInteractive(
    async(I) => {
        const result = await interactive (`
            1. Download the gen3-client from github repo - https://github.com/uc-cdis/cdis-data-client/releases
            2. Unzip the download and add the executable to directory, ~/.gen3/gen3-client.exe
            3. on terminal, echo 'export PATH=$PATH:~/.gen3' >> ~/.bash_profile or ~/.zshrc       
        `);
    expect(result.didPass, result.details).to,be.true;
    }
));

Scenario('Configure gen3-client @manual', ifInteractive(
    async(I) => {
        const result = await interactive (`
            1. go to the dedicated user's data commons you need your gen3-client configured with
            2. Login and go to Profile tab
            3. 'Create a API key' and download the json, downloaded as 'credential.json'
            4. use gen3-client configure command - gen3-client configure --profile=<profile_name> --cred=<credentials.json> --apiendpoint=<api_endpoint_url>
                where --cred is full path to 'credentials.json' and --apiendpoint is the datacommons.org
                example : 
                gen3-client configure --profile=bob --cred=/Users/Bob/Downloads/credentials.json --apiendpoint=https://data.mycommons.org
        `);
    expect(result.didPass, result.details).to,be.true;
    }
));

Scenario('Version Checker error @manual', ifInteractive(
    async(I) => {
        const result = await interactive (`
            1. After the successful installation and configuration of profile, user can use gen3-client command on terminal console
            2. the version checker will show 'A new version of gen3-client is avaliable! The latest version is ${LATEST_VERSION}. You are using version ${CURRENT_VERSION}
            Please download the latest gen3-client release from https://github.com/uc-cdis/cdis-data-client/releases/latest' message on the console if a newer version of gen3-client is available
        `);
    expect(result.didPass, result.details).to,be.true;
    }
));

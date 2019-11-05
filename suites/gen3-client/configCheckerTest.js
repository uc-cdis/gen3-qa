Feature('Gen3-client Configuration Error Checker - https://ctds-planx.atlassian.net/browse/PXP-4571 ')

const chai = require('chai');
const {interactive, ifInteractive} = require('../../utils/interactive.js');
const expect = chai.expect;
const hostname = process.env.HOSTNAME;
const profile = process.env.NAMESPACE;

Scenario('Install gen3-client @manual', ifInteractive(
    async(I) => {
        const result = await interactive (`
            1. Download the newest version of gen3-client from github repo - https://github.com/uc-cdis/cdis-data-client/releases/tag/{latest-tag}
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

Scenario('Wrong API key correct apiendpoint @manual', ifInteractive(
    async(I) => {
        const result = await interactive (`
            1. user has a wrong cred.json (API key) and correct API endpoint
            2. the misconfiguration checker should show 401 which means the API key for the user is not correct
        `);
    expect (result.didPass, result.details).to,be.true;
    }
));

Scenario('correct API key wrong apiendpoint @manual', ifInteractive(
    async(I) => {
        const result = await interactive (`
            1. user has a correct cred.json (API key) but wrong API endpoint
            2. the misconfiguration checker should show 404 or 405 which means user is hitting a wrong host  
        `);
    expect (result.didPass, result.details).to,be.true;
    }
));




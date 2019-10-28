Feature('Data-Portal File Upload test with gen3-client CLI - https://ctds-planx.atlassian.net/browse/PXP-4542');

// To be executed with GEN3_SKIP_PROJ_SETUP=true -- No need to set up program / retrieve access token, etc.

const chai = require('chai');
const {interactive, ifInteractive} = require('../../utils/interactive.js');
const expect = chai.expect;
const hostname = process.env.HOSTNAME;
const profile = process.env.NAMESPACE

Scenario('Create a folder in $vpc_name and generate a test file @manual', ifInteractive(
    async(I) => {
        const result = await interactive (`
            1. Login into $vpc_name
            2. Create a new directory called "test_upload"
            3. Go to directory /test_upload
            4. Create a new file (echo "gen3 test" > test.txt)
            5. Generate a sha256 hash of the test file and take note of the value
               (Linux: cat test.txt | sha256sum)
               (OSX: shasum -a 256 test.txt)
               e.g., % shasum -a 256 test.txt
                     d3b79a56c5641cc2e44f3067fba5410684df8fbb287c42a5d25496d19c736e33  test.txt
            `);
    expect(result.didPass, result.details).to.be.true;
    }
));

// The test assumes the presence of a valid profile configuration in ~/.gen3/config (containing api-key, JWT token and api endpoint)
Scenario('Run the gen3-client CLI utility and upload the test file to ${profile} @manual', ifInteractive(
    async(I) => {
        const result = await interactive (`
            1. Run the gen3-cli upload command: gen3-client upload --profile=${profile} --upload-path=test.txt
            2. Take note of the GUID that is printed as part of the output
        `);
    expect(result.didPass, result.details).to.be.true;
    }
));

Scenario('Download the same test file and verify integrity @manual', ifInteractive(
    async(I) => {
        const result = await interactive (`
            1. Run the gen3-cli download command: gen3-client download-single --profile=marcelo --guid=<GUI from the previous scenario>
            2. Generate a sha256 hash of the file that was downloaded (see instructions from the first scenario)
            3. Check if both files have the same hash (i.e., confirming integrity of the file by comparing the hash values)
        `);
    expect(result.didPass, result.details).to.be.true;
    }
));

// clean-up
Scenario('Delete file from the commons system and also from local disk @manual', ifInteractive(
    async(I) => {
        const result = await interactive (`
            1. Login to the ${hostname} web interface and take note of the value of the "access_token" cookie
            2. Store the access token in an environment variable (export ACCESS_TOKEN="<access_token>")
            2. Run the following curl command to produce an HTTP DELETE request to remove all references of the test file from the system. Make sure you provide the same GUID correspondent to the test file that has been used in previous scenarios. The HTTP Response Code must be 2xx (not 5xx).
               curl -L -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer \$\{ACCESS_TOKEN\}" -X DELETE 'https://${hostname}/user/data/<GUID>'
            3. Delete the test file from the local disk (rm test.txt)
        `);
    expect(result.didPass, result.details).to.be.true;
    }
));


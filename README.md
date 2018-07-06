# Gen3 Automatic Integration Test
Test steps are written in steps folder (ie test setup and utility functions) while the details to each test are declared in assertions folder. Two folders `portal` and `apis` contains tests for portal and REST apis respectively.

Testing requires the following environment variables  
`ACCESS_TOKEN`: used for requests, provided by fence  
`EXPIRED_ACCESS_TOKEN`: used to test result for expired access token, provided by fence  
`INDEX_USERNAME`: username for indexd requests  
`INDEX_PASSWORD`: password for indexd requests  
`HOSTNAME`: hostname for tests (e.g. qa.planx-pla.net)  

After setting the environment variables, do the following
```bash
# Create a condecept.json config file
npm run custom

# Install all required node modules
npm install

# Install selenium jar and required drivers
./node_modules/selenium-standalone/bin/selenium-standalone install
```

Selenium requires Java SDK SE 8, so run the following command:
```bash
javac -version
```
If you have the SDK it should print something like `javac 1.8.0_171`, where my SDK version here is 8.0_171. If it doesn't print out a version or you get some alert telling you to install java, go to the Oracle website and install the most recent Java SDK SE 8.

## Running the tests locally
Start the selenium server in one window:
```bash
./node_modules/selenium-standalone/bin/selenium-standalone start
```

Once the selenium server is running, open another window and run the tests:
```bash
npm run test
```

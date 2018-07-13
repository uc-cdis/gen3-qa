# Gen3 Automatic Integration Test
Test steps are written in steps folder while the details to test are declared in questions folder. Two folders `portal` and `apis` contains tests for portal and REST apis respectively.

Test process needs `ACCESS_TOKEN, EXPIRED_ACCESS_TOKEN, INDEX_USERNAME, INDEX_PASSWORD` environment variables.

If running gen3-qa locally, make sure you have an open OpenVPN connection to gdc. Then, start a Selenium server with
```
./node_modules/selenium-standalone/bin/selenium-standalone start
```
and then run 
```
bash local_run.sh
```
to run the tests. Note that bash local_run.sh will ssh onto a namespace (which is set at the top of the script) to generate these environment variables for testing

After having these environment variables, running test by these steps:
- npm install
- npm run test
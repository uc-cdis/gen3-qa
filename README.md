# Gen3 Automatic Integration Test
Test steps are written in steps folder while the details to test are declared in questions folder. Two folders `portal` and `apis` contains tests for portal and REST apis respectively.

Test process needs `ACCESS_TOKEN, EXPIRED_ACCESS_TOKEN, INDEX_USERNAME, INDEX_PASSWORD` environment variables.

After having these environment variables, running test by these steps:
- npm install
- npm run test
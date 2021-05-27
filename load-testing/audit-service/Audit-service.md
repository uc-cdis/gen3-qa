# How to run audit service load test

### Step 1:
The load test script mocks the POSTING of some logs on `presigned-url` and `login` endpoint, we need to turn off/ comment out
the config (only for purpose of load testing) in `kube/services/revproxy/gen3.nginx.conf/audit-service.conf` in cloud-automation.
This should be done from within the environment.
```
# only allow GET requests. POSTing audit logs is only for internal use
    limit_except GET {
      deny all;
    }
```
The above configuration denies the user to POST logs on the endpoints in audit service

### Step 2:
`gen3 kube-setup-revproxy`

### NOTE : After testing is done, turn on / uncomment the above configuration in audit-service.conf, and run STEP 2

### Step 3:
The user needs to be added to the user.yaml file with `audit_reader` policy

### Step 4:
Also the user would need API key created in particular env which user needs to run audit service load testing in. 
Download the `credential.json` file and paste in gen3-qa folder

### Step 5: Running the load tests
You can either run via 
1. Jenkins job https://jenkins.planx-pla.net/job/gen3-run-load-tests/
2. on terminal, run
`node load-testing/loadTestRunner.js credentials.json load-testing/sample-descriptors/load-test-audit-login-sample.json`

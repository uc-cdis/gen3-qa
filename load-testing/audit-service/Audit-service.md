# How to run audit service load test

### Step 1:
The load test script mocks the POSTing of some logs on `presigned-url` and `login` endpoint, we need to turn off/ comment out
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
Also, the user would need API key created in particular env which user needs to run audit service load testing in. 
Download the `credential.json` file and paste in gen3-qa folder

### Step 5: Running the load tests
You can either run via 
- Jenkins job https://jenkins.planx-pla.net/job/gen3-run-load-tests/

    How are above steps achieved in the Jenkins-job/config
    
    In the pre-test setup, we backup the original conf file and comment/delete the config
    ```
    if [ "$LOAD_TEST_DESCRIPTOR" == "audit-presigned-url" ] || [ "$LOAD_TEST_DESCRIPTOR" == "audit-presigned-url" ]; then
      # backing up the original audit service conf file
      cp cloud-automation/kube/services/revproxy/gen3.nginx.conf/audit-service.conf audit-service.conf.backup
      # enable the POST request
      sed -i '/limit_except/,+3d' cloud-automation/kube/services/revproxy/gen3.nginx.conf/audit-service.conf
      # setup revproxy with new audit service conf
      gen3 kube-setup-revproxy
    ```
    
    and after the load test is executed we run this to put back revproxy to original config
    ```
    # replacing with the original conf into the audit-service.conf 
    cp audit-service.conf.backup cloud-automation/kube/services/revproxy/gen3.nginx.conf/audit-service.conf
    # running kube-setup with the original conf
    gen3 kube-setup-revproxy
    ```

- on terminal, run locally
`node load-testing/loadTestRunner.js credentials.json load-testing/sample-descriptors/load-test-audit-login-sample.json`

# How to run audit service load test

### How is load Testing performed?
User visits the commons and logs in to the via Incommons Login or Google ir requests a PresignedURL, a message is send to AWS SQS via Fence 
which now sits between Fence and Audit Service. Audit service pulls in 10messages at a time from the queue to the audit DB. The load test will
send a HTTP GET request to either `/audit/log/login` or `/audit/log/presigned_url` over a duration of 5 minutes with 100 virtual 
users.

Before every run, the bash script will run `purge` command inside the bash script which will clear the SQS queue. So the
load test will work with 0 messages in the queue.

### Step 1:
The user needs to be added to the user.yaml file with `audit_reader` policy

### Step 2: if running the test locally
Also, the user would need API key created in particular env which user needs to run audit service load testing in. 
Download the `credential.json` file and paste in gen3-qa folder. 
Run this ->
```
# for executing load test on presigned-url endpoint
node load-testing/loadTestRunner.js credentials.json load-testing/sample-descriptors/load-test-audit-presigned-urls-sample.json

# for executing load test on login endpoint
 node load-testing/loadTestRunner.js credentials.json load-testing/sample-descriptors/load-test-audit-login-sample.json
```

### Step 3: Running the load tests via Jenkins Job
Jenkins job https://jenkins.planx-pla.net/job/gen3-run-load-tests/

In the pre-test setup, we populate the AWS SQS with some fake messages that are send via bash script (location link TBA)

```
if [ "$LOAD_TEST_DESCRIPTOR" == "audit-presigned-url" ]; then
  echo "Populating audit-service SQS with presigned-url messages"
  chmod u+x gen3-qa/load-testing/audit-service/sendPresignedURLMessages.sh
  bash gen3-qa/load-testing/audit-service/sendPresignedURLMessages.sh $SQS_URL
elif [ "$LOAD_TEST_DESCRIPTOR" == "audit-login" ]; then
  echo "Populating audit-service SQS with login messages"
  chmod u+x gen3-qa/load-testing/audit-service/sendLoginMessages.sh
  bash gen3-qa/load-testing/audit-service/sendLoginMessages.sh $SQS_URL
```

Now after the messages are send to the SQS, Audit service will start consuming these messages from the SQS and the 
`load-test-audit-<test-type>-sample.json` descriptor will run the `audit-<test>.json` which will invoke the HTTP GET request 
on audit service endpoints
    
    


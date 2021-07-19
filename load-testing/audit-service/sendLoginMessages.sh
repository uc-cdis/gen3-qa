#!/bin/bash
#
# Populates the SQS queue with couple of 100 messages for audit service load testing
#

export AWS_DEFAULT_REGION=us-east-1

awsURL='https://sqs.us-east-1.amazonaws.com/707767160287'
sqsURL='qaplanetv2--qa-niaid--audit-sqs'
message='
{
    "idp":"fence",
    "request_url": "",
    "status_code": 200,
    "sub": 1,
    "username": "user_loadtest",
}'

# clean up the queue before the load test runs
aws sqs purge-queue --queue-url "$awsURL/$sqsURL"

# send 20 dummy logs to audit-service sqs
for i in {1..100};
    do
        aws sqs send-message --queue-url "$awsURL/$sqsURL" --message-body "$message"
    done

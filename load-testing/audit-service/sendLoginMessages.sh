#!/bin/bash
#
# Populates the SQS queue with couple of 100 messages for audit service load testing
#
export AWS_DEFAULT_REGION=us-east-1

message= '
{
    idp: 'fence',
    request_url: '',
    status_code: 200,
    sub: 1,
    username: 'user10',
}
'
# get SQS url for audit-service-sqs
auditSQS= $(gen3 api safe-name audit-sqs)
echo ${auditSQS}

# send 20 dummy logs to audit-service sqs
for i in {1..2};
    do
        aws sqs send-message --queue-url "https://sqs.us-east-1.amazonaws.com/707767160287/${auditSQS}" --message-body "$message"
    done

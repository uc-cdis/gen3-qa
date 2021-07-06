#!/bin/bash
#
# Populates the SQS queue with couple of 100 messages for audit service load testing
#
export AWS_DEFAULT_REGION=us-east-1

message= '
{
    action: 'download',
    guid: 'dg.fake/b01ebf46-3832-4a75-8736-b09e8d9fd952',
    request_url: '/data/download/dg.fake/b01ebf46-3832-4a75-8736-b09e8d9fd952',
    resource_paths: ['/my/resource/path1', '/path2'],
    status_code: 200,
    sub: 10,
    username: 'user_91',
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

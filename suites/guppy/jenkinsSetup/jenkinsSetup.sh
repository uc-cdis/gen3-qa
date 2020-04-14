#!/bin/bash
#
# See https://www.elastic.co/guide/en/elasticsearch/reference/6.8/docs-bulk.html
#

export LOGHOST="$ESHOST"
gen3 es create toy_debug_1 canineData/toyMapping.json
curl -H 'Content-Type: application/x-ndjson' "${ESHOST}/toy_debug_1/thing/_bulk" --data-binary @canineData/toyBatch.ndjson

gen3 es create jenkins_subject_1 canineData/subjectMapping.json
gen3 es alias jenkins_subject_1 jenkins_subject_alias
curl -H 'Content-Type: application/x-ndjson' "${ESHOST}/jenkins_subject_1/subject/_bulk" --data-binary @canineData/subjectBatch.ndjson

gen3 es create jenkins_file_1 canineData/fileMapping.json
gen3 es alias jenkins_file_1 jenkins_file_alias
curl -H 'Content-Type: application/x-ndjson' "${ESHOST}/jenkins_file_1/file/_bulk" --data-binary @canineData/fileBatch.ndjson

gen3 es create jenkins_configs_1 canineData/arrayMapping.json
gen3 es alias jenkins_configs_1 jenkins_configs_alias

#
# Generating the Batch documents:
#
# jq -r -c '.[] | ._source' < subjectData.json | awk '{ print "{ \"index\" : {} }"; print $0; }' | jq -r -c . | tee subjectBatch.njson
# jq -r -c '.hits.hits[] | ._source' < fileData.json | awk '{ print "{ \"index\" : {} }"; print $0; }' | jq -r -c . | tee filesBatch.njson
#


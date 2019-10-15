This is Integration Test Plan for dcf-dataservice data replication. 

Summary : The main goal achieved by data replication is getting the GDC data from data center and AWS backup bucket to PlanX AWS buckets and Google buckets. Every one or two months, GDC releases new/updated/deleted data in a manifest files. PlanX will deploy three different jobs 
1. updating AWS buckets, 
2. updating Google buckets and 
3. updating IndexD records
GDC needs to update the exporting script so that manifest files contain - fileid, filename, filesize, hash, acl. The manifest will include all the files that are needed to be added in the release.

copying the data from GDC to AWS and Google buckets:
- AWS backup bucket and some data from data center to AWS buckets
- data from data center to Google Cloud buckets

The three main scenarios that need to be carried out :
1. dcf-dataservice takes a manifest
2. moves data to respective buckets
3. creates/updates IndexD records

AWS sync
1. create a directory in $vpc_name/apis_configs called dcf_dataservice.
2. put 'creds.json' and 'aws_creds_secrets' into dcf_dataservices
3. put 'GDC_project_map.json' in dcf_dataservice - contains aws_bucket_prefix and google_bucket_prefix helps determining which bucket an object needs to be copied
4. upload the manifest to S3 bucket
5. run jobs/kube-script-setup.sh 
(Example -> gen3 runjob jobs/aws-bucket-replicate-job.yaml GDC_BUCKET_NAME gdcbackup MANIFEST_S3 s3://tests/manifest THREAD_NUM 100 LOG_BUCKET log_bucket CHUNK_SIZE 50)

Google Cloud sync
1. create a directory in $vpc_name/apis_configs called dcf_dataservice.
2. put 'gcloud-creds-secrets' and 'dcf_dataservice_settings' into dcf_dataservice
3. put 'GDC_project_map.csv' into dcf_dataservice folder
4. upload manifest to a GS bucket gs://INPUT_BUCKET/5aa/ (manifest file provides a list of structured or unflatten objects in DCF)
5. run jobs/kube-script-setup.sh 
(Example -> gen3 runjob dcf-dataservice/jobs/google-bucket-replicate-job.yaml PROJECT cdis-test MAX_WORKERS 100 MANIFEST_FILE gs://INPUT_BUCKET/input/manifest IGNORED_FILE gs://INPUT_BUCKET/5aa/ignored_files_manifest.csv LOG_BUCKET log_bucket)

Updating the Indexd record


Feature('DCF dataservice Data Replication - https://ctds-planx.atlassian.net/browse/PXP-3483');

const chai = require('chai');
const { interactive, ifInteractive } = require('../../utils/interactive.js');

const { expect } = chai;

Scenario('AWS Sync - create a directory in $vpc_name/apis_configs called dcf_dataservice @manual', ifInteractive(
  async () => {
    const result = await interactive(`
            1. Login into $vpc_name
            2. go to directory /apis_configs
            3. create a new directory 'dcf_dataservice'
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('AWS Sync - put credentials and mapping file into directory /dcf_dataservice @manual', ifInteractive(
  async () => {
    const result = await interactive(`
            1. put 'cred.json' into dcf_dataservice directory
            2. put 'aws_cred_secrets' into dcf_dataservice directory
            3. put 'GDC_project_map.json' in dcf_dataservice directory
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('AWS Sync - upload the manifest @manual', ifInteractive(
  async () => {
    const result = await interactive(`
            1. upload the manifest to S3 bucket
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('AWS Sync - run the job @manual', ifInteractive(
  async () => {
    const result = await interactive(`
            1. run jobs/kube-script-setup.sh
            (Example : gen3 runjob jobs/aws-bucket-replicate-job.yaml GDC_BUCKET_NAME gdcbackup MANIFEST_S3 s3://tests/manifest THREAD_NUM 100 LOG_BUCKET log_bucket CHUNK_SIZE 50 )
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('GC Sync - put credentials and mapping file into directory /dcf_dataservice @manual', ifInteractive(
  async () => {
    const result = await interactive(`
            1. put 'gcloud-creds-secrets' and dcf_datservice_settings' into dcf_dataservice
            2. put 'GDC_project_map.csv into dcf_dataservice
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('GC Sync - upload manifest to GS bucket @manual', ifInteractive(
  async () => {
    const result = await ifInteractive(`
            1. upload manifest to GS Bucket gs://INPUT_BUCKET/input/
            2. create LOG_BUCKET
            3. put 'ignored_files_manifest.csv' into gs://INPUT_BUCKET/5aa/ 
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('GC Sync - run the job @manual', ifInteractive(
  async () => {
    const result = await interactive(`
            1. run jobs/kube-script-setup.sh
            (Example : gen3 runjob dcf-dataservice/jobs/google-bucket-replicate-job.yaml PROJECT cdis-test MAX_WORKERS 100 MANIFEST_FILE gs://INPUT_BUCKET/input/manifest IGNORED_FILE gs://INPUT_BUCKET/5aa/ignored_files_manifest.csv LOG_BUCKET log_bucket)
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('Check Indexd for updated data @manual', ifInteractive(
  async () => {
    const result = await interactive(`
            1. Check if the new files in the data replication process have updated the indexd
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

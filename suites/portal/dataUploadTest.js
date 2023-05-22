Feature('DataUploadTest @requires-portal @requires-sower @requires-ssjdispatcher @requires-fence @requires-sheepdog @requires-indexd');

// const { interactive, ifInteractive } = require('../../utils/interactive');
const { checkPod, sleepMS } = require('../../utils/apiUtil.js');
const { Bash } = require('../../utils/bash');

// const I = actor();
const createdGuids = [];
const createdFileNames = [];
let submitterID;

const bash = new Bash();
const inJenkins = (process.env.JENKINS_HOME !== '' && process.env.JENKINS_HOME !== undefined);

const generateFileAndGetUrlFromFence = async function (files, fence, accessTokenHeader) {
  // generate a file unique to this session
  const fileContents = 'this fake data file was generated and uploaded by the integration test suite\n';
  const fileObj = await files.createTmpFileWithRandomName(fileContents);
  const { fileName } = fileObj;

  // request a  presigned URL from fence
  const fenceUploadRes = await fence.do.getUrlForDataUpload(fileName, accessTokenHeader);
  fence.ask.hasUrl(fenceUploadRes);
  const fileGuid = fenceUploadRes.data.guid;
  createdGuids.push(fileGuid);
  createdFileNames.push(fileName);
  const presignedUrl = fenceUploadRes.data.url;
  return {
    fileObj: { ...fileObj, fileGuid },
    presignedUrl,
  };
};

const uploadFile = async function (I, dataUpload, indexd, sheepdog, nodes, fileObj, presignedUrl) {
  const { fileName } = fileObj;
  const { filePath } = fileObj;
  const { fileSize } = fileObj;
  const { fileMd5 } = fileObj;
  const { fileGuid } = fileObj;

  // upload the file to the S3 bucket using the presigned URL
  await dataUpload.uploadFileToS3(presignedUrl, filePath, fileSize);

  // additional scrutiny for file upload only when running inside Jenkins
  if (inJenkins) {
    const maxAttempts = 6;
    // const jenkinsNamespace = process.env.HOSTNAME.replace('.planx-pla.net', '');
    // const bucketName = `${jenkinsNamespace}-databucket-gen3`;
    const bucketName = bash.runCommand('gen3 secrets decode fence-config fence-config.yaml | yq -r .DATA_UPLOAD_BUCKET');
    if (process.env.DEBUG === 'true') {
      console.log(bucketName);
    }
    for (let i = 1; i <= maxAttempts; i += 1) {
      try {
        console.log(`waiting for file [${fileName}] with guid [${fileGuid}] to show up on ${bucketName}... - attempt ${i}`);
        await sleepMS(10000);

        const contentsOfTheBucket = await bash.runCommand(`aws s3 ls s3://${bucketName}/${fileGuid}/`);
        if (process.env.DEBUG === 'true') {
          console.log(`contentsOfTheBucket: ${contentsOfTheBucket}`);
        }
        if (contentsOfTheBucket.includes(fileName)) {
          console.log(`the file ${fileName} was found! Proceed with the rest of the test...`);
          break;
        } else {
          console.log('The file did now show up in the bucket yet...');
          if (i === maxAttempts) {
            throw new Error(`Max number of attempts reached: ${i}`);
          }
        }
      } catch (e) {
        throw new Error(`Failed to upload the file ${fileObj} to bucket ${bucketName} on attempt ${i}: ${e.message}`);
      }
    }
  }

  // wait for the indexd listener to add size, hashes and URL to the record
  const fileNode = {
    did: fileGuid,
    data: {
      md5sum: fileMd5,
      file_size: fileSize,
    },
  };

  await checkPod(I, 'indexing', 'ssjdispatcherjob', params = { nAttempts: 40, ignoreFailure: false, keepSessionAlive: true }); // eslint-disable-line no-undef

  await dataUpload.waitUploadFileUpdatedFromIndexdListener(indexd, fileNode);
};

BeforeSuite(async ({
  sheepdog, nodes, users, indexd,
}) => {
  try {
    // clean up in sheepdog
    await sheepdog.complete.findDeleteAllNodes();

    // clean up previous upload files
    await indexd.do.clearPreviousUploadFiles(users.mainAcct);
    await indexd.do.clearPreviousUploadFiles(users.auxAcct2);
    await indexd.do.clearPreviousUploadFiles(users.indexingAcct);

    // Add coremetadata node.
    // FIXME: once windmill allow parent nodes other than core-metadata-collection, remove this
    const newSubmitterID = await nodes.generateAndAddCoremetadataNode(sheepdog);
    submitterID = newSubmitterID;
  } catch (error) {
    console.log(error);
  }
});

Before(async ({ home }) => {
  await home.complete.login();
});

Scenario('Map uploaded files in windmill submission page @dataUpload @portal', async ({
  I, sheepdog, nodes, files, fence, users, indexd, portalDataUpload, dataUpload,
}) => {
  // generate file and register in fence, get url
  const { fileObj, presignedUrl } = await generateFileAndGetUrlFromFence(
    files,
    fence,
    users.mainAcct.accessTokenHeader,
  );

  if (!process.env.testedEnv.includes('midrc')) {
    // user1 should see 1 file, but not ready yet
    portalDataUpload.complete.checkUnmappedFilesAreInSubmissionPage(I, [fileObj], false);

    // upload file
    await uploadFile(I, dataUpload, indexd, sheepdog, nodes, fileObj, presignedUrl);

    // user1 should see 1 file ready
    portalDataUpload.complete.checkUnmappedFilesAreInSubmissionPage(I, [fileObj], true);

    // user1 map file in windmill
    await portalDataUpload.complete.mapFiles(I, [fileObj], submitterID);

    // user1 should see 0 files now because all files are mapped.
    portalDataUpload.complete.checkUnmappedFilesAreInSubmissionPage(I, []);
  }
}).retry(2);

Scenario('Cannot see files uploaded by other users @dataUpload @portal', async ({
  I, sheepdog, nodes, files, fence, users, indexd, portalDataUpload, dataUpload,
}) => {
  // user2 upload file2
  const { fileObj, presignedUrl } = await generateFileAndGetUrlFromFence(
    files,
    fence,
    users.auxAcct2.accessTokenHeader,
  );
  await uploadFile(I, dataUpload, indexd, sheepdog, nodes, fileObj, presignedUrl);

  // user1 cannot see file2
  await portalDataUpload.complete.checkUnmappedFilesAreNotInFileMappingPage(I, [fileObj]);
});

After(async ({ home }) => {
  await home.complete.logout();
});

AfterSuite(async ({
  sheepdog, indexd, files, dataUpload,
}) => {
  try {
    // clean up in sheepdog
    await sheepdog.complete.findDeleteAllNodes();

    // clean up in indexd and S3 (remove the records created by this test suite)
    await indexd.complete.deleteFiles(createdGuids);
    await dataUpload.cleanS3('clean-windmill-data-upload', createdGuids);
    createdFileNames.forEach(async ({ fileName }) => {
      await files.deleteFile(fileName);
    });
  } catch (error) {
    console.log(error);
  }
});

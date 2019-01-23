const fs = require('fs');

const { smartWait } = require('../../utils/apiUtil.js');
const homedir = require('os').homedir();
const inJenkins = (process.env.JENKINS_HOME !== '' && process.env.JENKINS_HOME !== undefined);


Feature('Data file upload flow');


/////////////
// GLOBALS //
/////////////

const fileContents = 'this fake data file was generated and uploaded by the integration test suite\n';

// maintain a list of GUIDs to delete in indexd and the S3 bucket at the end
let createdGuids = [];

// the following variables are set as part of the BeforeSuite step:
let fileName, filePath, fileSize, fileMd5;


////////////////////
// UTIL FUNCTIONS //
////////////////////

/**
 * request a  presigned URL from fence
 */
const getUploadUrlFromFence = async function (fence, users, indexd) {
  let accessHeader = users.mainAcct.accessTokenHeader;
  let res = await fence.do.getUrlForDataUpload(fileName, accessHeader);
  fence.ask.hasUrl(res);
  return res;
};

/**
 * upload a file to an S3 bucket using a presigned URL
 */
const uploadFileToS3 = async function (presignedUrl) {
  fs.createReadStream(filePath).pipe(require('request')({
    method: 'PUT',
    url: presignedUrl,
    headers: {
      'Content-Length': fileSize
    }
  }, function (err, res, body) {
    if (err) {
      throw new Error(err);
    }
  }));
};

/**
 * create a file that contains the list of GUIDs of files that were uploaded
 * to s3 during this testing session. The files will be deleted during the
 * CleanS3 step of the Jenkins pipeline
 */
const cleanS3 = async function (files) {
  if (inJenkins) {
    dirName = `${homedir}/s3-cleanup`;
    if (!fs.existsSync(dirName)){
      fs.mkdirSync(dirName);
    }
    files.createTmpFile(
      `${dirName}/${fileName}`,
      createdGuids.join("\n")
    );
    console.log(`Created ${fileName} in ${dirName}`);
  }
};

/**
 * wait until a file's hash and size are updated in indexd
 */
const waitForIndexdListener = async function(indexd, fileNode) {
  /**
   * return true if the record has been updated in indexd, false otherwise
   */
  const isRecordUpdated = async function(indexd, fileNode) {
    try {
      // check if indexd was updated with the correct hash and size
      await indexd.complete.checkFile(fileNode);
      return true;
    }
    catch {
      return false;
    }
  };

  const timeout = 60; // max number of seconds to wait
  let errorMessage = `The indexd listener did not complete the record after ${timeout} seconds`;

  await smartWait(isRecordUpdated, [indexd, fileNode], timeout, errorMessage);
};

/**
 * link metadata to an indexd file via sheepdog,
 * after submitting metadata for the parent nodes
 * /!\ this function does not include a check for success or
 * failure of the data_file node's submission
 */
const submitGraphAndFileMetadata = async function (sheepdog, nodes, fileGuid) {
  // prepare graph for metadata upload (upload parent nodes)
  await sheepdog.complete.addNodes(nodes.getPathToFile());
  return submitFileMetadata(sheepdog, nodes, fileGuid);
};

/**
 * link metadata to an indexd file via sheepdog
 * /!\ this function does not include a check for success or
 * failure of the data_file node's submission
 */
const submitFileMetadata = async function (sheepdog, nodes, fileGuid, submitter_id=null) {
  // submit metadata with object id via sheepdog
  metadata = nodes.getFileNode().clone();
  metadata.data.object_id = fileGuid;
  metadata.data.file_size = fileSize;
  metadata.data.md5sum = fileMd5;
  if (submitter_id) {
    metadata.data.submitter_id = submitter_id;
  }
  await sheepdog.do.addNode(metadata); // submit, but don't check for success

  // the result of the submission is stored in metadata.addRes by addNode()
  return metadata;
};

/**
 * Complete data upload flow using API calls
 * - Use fence to upload a file to S3
 * - Check that we cannot link metadata to a file without hash and size
 * - check that the indexd listener updates the record with the correct hash and size
 * - Link metadata to the file via sheepdog
 * - Download the file via fence and check who can download and when
 */
Scenario('File upload and download via API calls', async (fence, users, nodes, indexd, sheepdog) => {
  // request a  presigned URL from fence
  let fenceUploadRes = await getUploadUrlFromFence(fence, users, indexd);
  let fileGuid = fenceUploadRes.body.guid;
  createdGuids.push(fileGuid);
  let presignedUrl = fenceUploadRes.body.url;

  // check that a (blank) record was created in indexd
  fileNode = {
    did: fileGuid,
    data: {
      md5sum: fileMd5,
      file_size: fileSize
    }
  };
  await indexd.complete.checkRecordExists(fileNode);

  // try to link metadata to the file before the indexd listener updates the
  // record with size and hash: this should fail.
  // we simulate not waiting by not uploading the file to the S3 bucket yet

  // fail to submit metadata for this file
  let sheepdogRes = await submitGraphAndFileMetadata(sheepdog, nodes, fileGuid);
  sheepdog.ask.hasStatusCode(sheepdogRes.addRes, 400, 'Linking metadata to file without hash and size should not be possible');

  // check that we CANNOT download the file (there is no URL in indexd yet)
  let signedUrlRes = await fence.do.createSignedUrlForUser(fileGuid);
  fence.ask.hasNoUrl(signedUrlRes);

  // now, upload the file to the S3 bucket using the presigned URL
  await uploadFileToS3(presignedUrl);

  // wait for the indexd listener to add size, hashes and URL to the record
  await waitForIndexdListener(indexd, fileNode);

  // Try downloading before linking metadata to the file. It should succeed
  // for the uploader but fail for other users

  // the uploader can now download the file
  signedUrlRes = await fence.do.createSignedUrlForUser(fileGuid);
  await fence.complete.checkFileEquals(
    signedUrlRes,
    fileContents,
  );

  // a user who is not the uploader CANNOT download the file
  signedUrlRes = await fence.do.createSignedUrlForUser(fileGuid, userToken=users.auxAcct1.accessTokenHeader);
  fence.ask.assertStatusCode(signedUrlRes, 401, 'User who is not the uploader should not successfully download file before metadata linking');

  // submit metadata for this file (the parent nodes already exist)
  sheepdogRes = await submitFileMetadata(sheepdog, nodes, fileGuid);
  sheepdog.ask.addNodeSuccess(sheepdogRes);

  // a user who is not the uploader can now download the file
  signedUrlRes = await fence.do.createSignedUrlForUser(fileGuid, userToken=users.auxAcct1.accessTokenHeader);
  await fence.complete.checkFileEquals(
    signedUrlRes,
    fileContents,
  );

  // check that we cannot link metadata to a file that already has metadata:
  // fail to submit metadata for this file again
  sheepdogRes = await submitFileMetadata(sheepdog, nodes, fileGuid,submitter_id='submitter_id_new_value');
  sheepdog.ask.hasStatusCode(metadata.addRes, 400, 'Metadata linking to a file that already has metadata should not be possible');
});

/**
 * A user who does not have upload access should not be able to upload
 * or download files
 */
Scenario('User without role cannot upload', async (fence, users, nodes, indexd) => {

  // this user does not have the appropriate role
  let token = users.auxAcct1.accessTokenHeader;

  // request a  presigned URL from fence
  let fenceUploadRes = await fence.do.getUrlForDataUpload(fileName, token);

  // fence should not let this user upload
  fence.ask.hasNoUrl(fenceUploadRes);
  fence.ask.assertStatusCode(fenceUploadRes, 403, 'This user should not be able to download');
});

/**
 * This time, use the gen3 data client to upload and download the file
 */
Scenario('File upload and download via client', async (dataClient, indexd, nodes, files) => {
  // use gen3 client to upload a file
  let fileGuid = await dataClient.do.uploadFile(filePath);
  createdGuids.push(fileGuid);

  // check that a (blank) record was created in indexd
  fileNode = {
    did: fileGuid,
    data: {
      md5sum: fileMd5,
      file_size: fileSize
    }
  };
  await indexd.complete.checkRecordExists(fileNode);

  // wait for the indexd listener to add size, hashes and URL to the record
  await waitForIndexdListener(indexd, fileNode);

  // download the file via the data client
  downloadPath = './tmpFileDestination.txt';
  await dataClient.complete.downloadFile(files, fileGuid, downloadPath, fileContents);
});

/**
 * Upload a file, then delete it through fence. Aftert deletion, the file
 * should not be accessible for metadata linking or download
 */
Scenario('Data file deletion', async (fence, users, indexd, sheepdog, nodes) => {
  // request a  presigned URL from fence
  let fenceUploadRes = await getUploadUrlFromFence(fence, users, indexd);
  let fileGuid = fenceUploadRes.body.guid;
  let presignedUrl = fenceUploadRes.body.url;

  // upload the file to the S3 bucket using the presigned URL
  await uploadFileToS3(presignedUrl);

  fileNode = {
    did: fileGuid,
    data: {
      md5sum: fileMd5,
      file_size: fileSize
    }
  };

  // wait for the indexd listener to add size, hashes and URL to the record
  await waitForIndexdListener(indexd, fileNode);

  // check that a user who is not the uploader cannot delete the file
  let fenceRes = await fence.do.deleteFile(fileGuid, userHeader=users.auxAcct1.accessTokenHeader);
  fence.ask.assertStatusCode(fenceRes, 403, 'File deletion from user who is not file uploader should not be possible');

  // delete the file
  await fence.complete.deleteFile(fileGuid);

  // no match in indexd after delete
  let indexdRes = await indexd.do.getFile(fileNode);
  indexd.ask.resultFailure(indexdRes);

  // no metadata linking after delete
  let sheepdogRes = await submitGraphAndFileMetadata(sheepdog, nodes, fileGuid);
  sheepdog.ask.hasStatusCode(sheepdogRes.addRes, 400, 'Metadata linking should not be possible after file deletion');

  // no download after delete
  let signedUrlRes = await fence.do.createSignedUrlForUser(fileGuid);
  fence.ask.assertStatusCode(signedUrlRes, 404, 'File download should not be possible after file deletion');
});

/**
 * Upload 2 files with the same contents (so same hash and size) and
 * link metadata to them via sheepdog
 */
Scenario('Upload the same file twice', async (sheepdog, indexd, nodes, users, fence) => {
  ////////////
  // FILE 1 //
  ////////////

  // request a  presigned URL from fence
  let fenceUploadRes = await getUploadUrlFromFence(fence, users, indexd);
  let fileGuid = fenceUploadRes.body.guid;
  createdGuids.push(fileGuid);
  let presignedUrl = fenceUploadRes.body.url;

  // upload the file to the S3 bucket using the presigned URL
  await uploadFileToS3(presignedUrl);

  let fileNode = {
    did: fileGuid,
    data: {
      md5sum: fileMd5,
      file_size: fileSize
    }
  };

  // wait for the indexd listener to add size, hashes and URL to the record
  await waitForIndexdListener(indexd, fileNode);

  // submit metadata for this file
  let sheepdogRes = await submitGraphAndFileMetadata(sheepdog, nodes, fileGuid);
  sheepdog.ask.addNodeSuccess(sheepdogRes);

  // check that the file can be downloaded
  let signedUrlRes = await fence.do.createSignedUrlForUser(fileGuid);
  await fence.complete.checkFileEquals(
    signedUrlRes,
    fileContents,
  );

  ////////////
  // FILE 2 //
  ////////////

  // request a  presigned URL from fence
  fenceUploadRes = await getUploadUrlFromFence(fence, users, indexd);
  fileGuid = fenceUploadRes.body.guid;
  createdGuids.push(fileGuid);
  presignedUrl = fenceUploadRes.body.url;

  // upload the file to the S3 bucket using the presigned URL
  await uploadFileToS3(presignedUrl);

  // wait for the indexd listener to add size, hashes and URL to the record
  fileNode.did = fileGuid;
  await waitForIndexdListener(indexd, fileNode);

  // submit metadata for this file (the parent nodes already exist)
  sheepdogRes = await submitFileMetadata(sheepdog, nodes, fileGuid,submitter_id='submitter_id_new_value');
  sheepdog.ask.addNodeSuccess(sheepdogRes);

  // check that the file can be downloaded
  signedUrlRes = await fence.do.createSignedUrlForUser(fileGuid);
  await fence.complete.checkFileEquals(
    signedUrlRes,
    fileContents,
  );
});

BeforeSuite(async (dataClient, fence, users, sheepdog, indexd, files) => {
  // configure the gen3-client
  await dataClient.do.configureClient(fence, users, files);

  // clean up in sheepdog
  await sheepdog.complete.findDeleteAllNodes();

  // generate a file name unique to this session
  let rand = (Math.random() + 1).toString(36).substring(2,7); // 5 random chars
  fileName = `qa-upload-file_${rand}.txt`;
  filePath = './' + fileName;

  // create a local file to upload and store its size and hash
  await files.createTmpFile(filePath, fileContents);
  fileSize = files.getFileSize(filePath);
  fileMd5 = await files.getFileHash(filePath);
});

AfterSuite(async (files, indexd) => {
  // delete the temp file from local storage
  if (fs.existsSync(filePath)) {
    files.deleteFile(filePath);
  }

  // clean up in indexd and S3 (remove the records created by this test suite)
  // Note: we don't use fence's /delete endpoint here because it does not allow
  // deleting from indexd records that have already been linked to metadata
  await indexd.complete.deleteFiles(createdGuids);
  await cleanS3(files);
});

Before((nodes) => {
  // Refresh nodes before every test to clear any appended results, id's, etc
  nodes.refreshPathNodes();
});

After(async (sheepdog) => {
  // clean up in sheepdog
  await sheepdog.complete.findDeleteAllNodes();
});

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
var createdGuids = [];

// the following variables are set as part of the BeforeSuite step:
var fileName, filePath, fileSize, fileMd5;


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
 * Use an API call to fence to upload a file to S3 and check that the
 * indexd listener updates the record with the correct hash and size
 */
Scenario('File upload via API calls', async (fence, users, nodes, indexd, files) => {
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

  // upload the file to the S3 bucket using the presigned URL
  await files.uploadFileToS3(presignedUrl, filePath, fileSize);

  // wait for the indexd listener to add size, hashes and URL to the record
  await files.waitUploadFileUpdatedFromIndexdListener(indexd, fileNode);
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
  fence.ask.assertStatusCode(fenceUploadRes, 403);
});

/**
 * Upload a file, link metadata to it via sheepdog and download it
 */
Scenario('Link metadata to file and download', async (sheepdog, indexd, nodes, users, fence, files) => {
  // request a  presigned URL from fence
  let fenceUploadRes = await getUploadUrlFromFence(fence, users, indexd);
  let fileGuid = fenceUploadRes.body.guid;
  createdGuids.push(fileGuid);
  let presignedUrl = fenceUploadRes.body.url;

  // upload the file to the S3 bucket using the presigned URL
  await files.uploadFileToS3(presignedUrl, filePath, fileSize);

  let fileNode = {
    did: fileGuid,
    data: {
      md5sum: fileMd5,
      file_size: fileSize
    }
  };

  // wait for the indexd listener to add size, hashes and URL to the record
  await files.waitUploadFileUpdatedFromIndexdListener(indexd, fileNode);

  // submit metadata for this file
  let sheepdogRes = await files.submitFileMetadata(sheepdog, nodes, fileGuid, fileSize, fileMd5);
  sheepdog.ask.addNodeSuccess(sheepdogRes);

  // download the file via fence
  var signedUrlRes = await fence.do.createSignedUrlForUser(fileGuid);
  await fence.complete.checkFileEquals(
    signedUrlRes,
    fileContents,
  );

  // check that a user who is not the uploader can download the file
  signedUrlRes = await fence.do.createSignedUrlForUser(fileGuid, userToken=users.auxAcct1.accessTokenHeader);
  await fence.complete.checkFileEquals(
    signedUrlRes,
    fileContents,
  );
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
  await files.waitUploadFileUpdatedFromIndexdListener(indexd, fileNode);

  // download the file via the data client
  downloadPath = './tmpFileDestination.txt';
  await dataClient.complete.downloadFile(files, fileGuid, downloadPath, fileContents);
});

/**
 * The linking should fail
 */
Scenario('Link metadata to file that already has metadata', async (fence, users, indexd, sheepdog, nodes, files) => {
  // request a  presigned URL from fence
  let fenceUploadRes = await getUploadUrlFromFence(fence, users, indexd);
  let fileGuid = fenceUploadRes.body.guid;
  createdGuids.push(fileGuid);
  let presignedUrl = fenceUploadRes.body.url;

  // upload the file to the S3 bucket using the presigned URL
  await files.uploadFileToS3(presignedUrl, filePath, fileSize);

  let fileNode = {
    did: fileGuid,
    data: {
      md5sum: fileMd5,
      file_size: fileSize
    }
  };

  // wait for the indexd listener to add size, hashes and URL to the record
  await files.waitUploadFileUpdatedFromIndexdListener(indexd, fileNode);

  // submit metadata for this file
  let sheepdogRes = await files.submitFileMetadata(sheepdog, nodes, fileGuid, fileSize, fileMd5);
  sheepdog.ask.addNodeSuccess(sheepdogRes);

  // fail to submit metadata for this file again
  metadata = nodes.getFileNode().clone();
  metadata.data.object_id = fileGuid;
  metadata.data.file_size = fileSize;
  metadata.data.md5sum = fileMd5;
  metadata.data.submitter_id = 'submitted_unaligned_reads_new_value';
  sheepdogRes = await sheepdog.do.addNode(metadata);
  sheepdog.ask.hasStatusCode(metadata.addRes, 400);
});

/**
 * Upload a file and try to link metadata to it via sheepdog before the
 * indexd listener updates the record with file and hash: should fail
 */
Scenario('Link metadata to file without hash and size', async (users, fence, sheepdog, nodes, indexd, files) => {
  // request a  presigned URL from fence
  let fenceUploadRes = await getUploadUrlFromFence(fence, users, indexd);
  let fileGuid = fenceUploadRes.body.guid;
  createdGuids.push(fileGuid);
  let presignedUrl = fenceUploadRes.body.url;

  // simulate NOT waiting for the indexd listener to add size, hashes and
  // URL to the record by not uploading the file to the S3 bucket at all

  let fileNode = {
   did: fileGuid,
   data: {
     md5sum: fileMd5,
     file_size: fileSize
   }
  };

  // fail to submit metadata for this file
  let sheepdogRes = await files.submitFileMetadata(sheepdog, nodes, fileGuid, fileSize, fileMd5);
  sheepdog.ask.hasStatusCode(sheepdogRes.addRes, 400);

  // check that we CANNOT download the file (there is no URL in indexd yet)
  const signedUrlRes = await fence.do.createSignedUrlForUser(fileGuid);
  fence.ask.hasNoUrl(signedUrlRes);
});

/**
 * The download should success for the uploader but fail for other users
 */
Scenario('Download before metadata linking', async (fence, users, indexd, files) => {
  // request a  presigned URL from fence
  let fenceUploadRes = await getUploadUrlFromFence(fence, users, indexd);
  let fileGuid = fenceUploadRes.body.guid;
  createdGuids.push(fileGuid);
  let presignedUrl = fenceUploadRes.body.url;

  // upload the file to the S3 bucket using the presigned URL
  await files.uploadFileToS3(presignedUrl, filePath, fileSize);

  let fileNode = {
    did: fileGuid,
    data: {
      md5sum: fileMd5,
      file_size: fileSize
    }
  };

  // wait for the indexd listener to add size, hashes and URL to the record
  await files.waitUploadFileUpdatedFromIndexdListener(indexd, fileNode);

  // do NOT submit metadata for this file

  // the uploader can download the file
  var signedUrlRes = await fence.do.createSignedUrlForUser(fileGuid);
  await fence.complete.checkFileEquals(
    signedUrlRes,
    fileContents,
  );

  // a user who is not the uploader CANNOT download the file
  signedUrlRes = await fence.do.createSignedUrlForUser(fileGuid, userToken=users.auxAcct1.accessTokenHeader);
  fence.ask.assertStatusCode(signedUrlRes, 401);
});

/**
 * Upload a file, then delete it through fence. Aftert deletion, the file
 * should not be accessible for metadata linking or download
 */
Scenario('Data file deletion', async (fence, users, indexd, sheepdog, nodes, files) => {
  // request a  presigned URL from fence
  let fenceUploadRes = await getUploadUrlFromFence(fence, users, indexd);
  let fileGuid = fenceUploadRes.body.guid;
  let presignedUrl = fenceUploadRes.body.url;

  // upload the file to the S3 bucket using the presigned URL
  await files.uploadFileToS3(presignedUrl, filePath, fileSize);

  fileNode = {
    did: fileGuid,
    data: {
      md5sum: fileMd5,
      file_size: fileSize
    }
  };

  // wait for the indexd listener to add size, hashes and URL to the record
  await files.waitUploadFileUpdatedFromIndexdListener(indexd, fileNode);

  // check that a user who is not the uploader cannot delete the file
  let fenceRes = await fence.do.deleteFile(fileGuid, userHeader=users.auxAcct1.accessTokenHeader);
  fence.ask.assertStatusCode(fenceRes, 403);

  // delete the file
  await fence.complete.deleteFile(fileGuid);

  // no match in indexd after delete
  let indexdRes = await indexd.do.getFile(fileNode);
  indexd.ask.resultFailure(indexdRes);

  // no metadata linking after delete
  let sheepdogRes = await files.submitFileMetadata(sheepdog, nodes, fileGuid, fileSize, fileMd5);
  sheepdog.ask.hasStatusCode(sheepdogRes.addRes, 400);

  // no download after delete
  var signedUrlRes = await fence.do.createSignedUrlForUser(fileGuid);
  fence.ask.assertStatusCode(signedUrlRes, 404);
});

/**
 * Upload 2 files with the same contents (so same hash and size) and
 * link metadata to them via sheepdog
 */
Scenario('Upload the same file twice', async (sheepdog, indexd, nodes, users, fence, files) => {
  ////////////
  // FILE 1 //
  ////////////

  // request a  presigned URL from fence
  let fenceUploadRes = await getUploadUrlFromFence(fence, users, indexd);
  let fileGuid = fenceUploadRes.body.guid;
  createdGuids.push(fileGuid);
  let presignedUrl = fenceUploadRes.body.url;

  // upload the file to the S3 bucket using the presigned URL
  await files.uploadFileToS3(presignedUrl, filePath, fileSize);

  let fileNode = {
    did: fileGuid,
    data: {
      md5sum: fileMd5,
      file_size: fileSize
    }
  };

  // wait for the indexd listener to add size, hashes and URL to the record
  await files.waitUploadFileUpdatedFromIndexdListener(indexd, fileNode);

  // submit metadata for this file
  let sheepdogRes = await files.submitFileMetadata(sheepdog, nodes, fileGuid, fileSize, fileMd5);
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
  await files.uploadFileToS3(presignedUrl, filePath, fileSize);

  fileNode = {
    did: fileGuid,
    data: {
      md5sum: fileMd5,
      file_size: fileSize
    }
  };

  // wait for the indexd listener to add size, hashes and URL to the record
  await files.waitUploadFileUpdatedFromIndexdListener(indexd, fileNode);

  // submit metadata for this file. not using the util function here because:
  // 1- there is no need to submit the parent nodes again
  // 2- a different submitter_id must be used
  metadata = nodes.getFileNode().clone();
  metadata.data.object_id = fileGuid;
  metadata.data.file_size = fileSize;
  metadata.data.md5sum = fileMd5;
  metadata.data.submitter_id = 'submitted_unaligned_reads_new_value';
  await sheepdog.do.addNode(metadata);
  sheepdog.ask.addNodeSuccess(metadata);

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

  // generate a file unique to this session
  const fileObj = await files.createTmpFileWithRandomeNameAndContent();
  fileName = fileObj.fileName;
  filePath = fileObj.filePath;
  fileSize = fileObj.fileSize;
  fileMd5 = fileObj.fileMd5;
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
  // TODO: store in a file the GUIDs to delete in S3 (see PXP-2206)
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

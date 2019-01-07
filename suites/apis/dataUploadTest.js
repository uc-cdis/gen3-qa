const fs = require('fs');

const { smartWait } = require('../../utils/apiUtil.js');


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

  const timeout = 30; // max number of seconds to wait
  let errorMessage = `The indexd listener did not complete the record after ${timeout} seconds`;

  await smartWait(isRecordUpdated, [indexd, fileNode], timeout, errorMessage);
};

/**
 * link metadata to an indexd file via sheepdog
 * /!\ this function does not include a check for success or
 * failure of the data_file node's submission
 */
const submitFileMetadata = async function (sheepdog, nodes, fileGuid) {
  // prepare graph for metadata upload (upload parent nodes)
  await sheepdog.complete.addNodes(nodes.getPathToFile());

  // submit metadata with object id via sheepdog
  metadata = nodes.getFileNode().clone();
  metadata.data.object_id = fileGuid;
  metadata.data.file_size = fileSize;
  metadata.data.md5sum = fileMd5;
  await sheepdog.do.addNode(metadata); // submit, but don't check for success

  // the result of the submission is stored in metadata.addRes by addNode()
  return metadata;
};


const deleteFromS3 = async function (guidList) {
  // TODO: how to do this without access to the aws creds in fence-config?
};

/**
 * Use an API call to fence to upload a file to S3 and check that the
 * indexd listener updates the record with the correct hash and size
 */
Scenario('File upload via API calls', async (fence, users, nodes, indexd) => {
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
  await uploadFileToS3(presignedUrl);

  /////////
  // TODO: remove when indexd-listener is set up on the QA environments
  /////////
  // return

  // wait for the indexd listener to add size, hashes and URL to the record
  await waitForIndexdListener(indexd, fileNode);
});

/**
 * A user who does not have upload access should not be able to upload
 * or download files
 */
Scenario('User without role cannot upload', async (fence, users, nodes, indexd) => {
  /////////
  // TODO: remove when new role is created
  /////////
  return

  // request a  presigned URL from fence
  // this user does not have the appropriate role
  let token = users.auxAcct1.accessTokenHeader;
  let fenceUploadRes = await fence.do.getUrlForDataUpload(fileName, token);
  fence.ask.hasNoUrl(fenceUploadRes);
});

/**
 * Upload a file, link metadata to it via sheepdog and download it
 */
Scenario('Link metadata to file and download', async (sheepdog, indexd, nodes, users, fence) => {
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

  /////////
  // TODO: remove when indexd-listener is set up on the QA environments
  /////////
  return

  // wait for the indexd listener to add size, hashes and URL to the record
  await waitForIndexdListener(indexd, fileNode);

  // submit metadata for this file
  let sheepdogRes = await submitFileMetadata(sheepdog, nodes, fileGuid);
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
  /////////
  // TODO: remove when the gen3 client's new release is set up in jenkins
  /////////
  return

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

  /////////
  // TODO: remove when indexd-listener is set up on the QA environments
  /////////
  return

  // wait for the indexd listener to add size, hashes and URL to the record
  await waitForIndexdListener(indexd, fileNode);

  // download the file via the data client
  downloadPath = './tmpFileDestination.txt';
  await dataClient.complete.downloadFile(files, fileGuid, downloadPath, fileContents);
});

/**
 * The linking should fail
 */
Scenario('Link metadata to file that already has metadata', async (fence, users, indexd, sheepdog, nodes) => {
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

  /////////
  // TODO: remove when indexd-listener is set up on the QA environments
  /////////
  return

  // wait for the indexd listener to add size, hashes and URL to the record
  await waitForIndexdListener(indexd, fileNode);

  // submit metadata for this file
  let sheepdogRes = await submitFileMetadata(sheepdog, nodes, fileGuid);
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
Scenario('Link metadata to file without hash and size', async (users, fence, sheepdog, nodes, indexd) => {
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
  let sheepdogRes = await submitFileMetadata(sheepdog, nodes, fileGuid);
  sheepdog.ask.hasStatusCode(sheepdogRes.addRes, 400);

  // check that we CANNOT download the file (there is no URL in indexd yet)
  const signedUrlRes = await fence.do.createSignedUrlForUser(fileGuid);
  fence.ask.hasNoUrl(signedUrlRes);
});

/**
 * The download should success for the uploader but fail for other users
 */
Scenario('Download before metadata linking', async (fence, users, indexd) => {
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

  /////////
  // TODO: remove when indexd-listener is set up on the QA environments
  /////////
  return

  // wait for the indexd listener to add size, hashes and URL to the record
  await waitForIndexdListener(indexd, fileNode);

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

  /////////
  // TODO: remove when indexd-listener is set up on the QA environments
  /////////
  return

  // wait for the indexd listener to add size, hashes and URL to the record
  await waitForIndexdListener(indexd, fileNode);

  // check that a user who is not the uploader cannot delete the file
  let fenceRes = await fence.do.deleteFile(fileGuid, userHeader=users.auxAcct1.accessTokenHeader);
  fence.ask.assertStatusCode(fenceRes, 403);

  // delete the file
  await fence.complete.deleteFile(fileGuid);

  // no match in indexd after delete
  let indexdRes = await indexd.do.getFile(fileNode);
  indexd.ask.resultFailure(indexdRes);

  // no metadata linking after delete
  let sheepdogRes = await submitFileMetadata(sheepdog, nodes, fileGuid);
  sheepdog.ask.hasStatusCode(sheepdogRes.addRes, 400);

  // no download after delete
  var signedUrlRes = await fence.do.createSignedUrlForUser(fileGuid);
  fence.ask.assertStatusCode(signedUrlRes, 404);
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

  /////////
  // TODO: remove when indexd-listener is set up on the QA environments
  /////////
  return

  // wait for the indexd listener to add size, hashes and URL to the record
  await waitForIndexdListener(indexd, fileNode);

  // submit metadata for this file
  let sheepdogRes = await submitFileMetadata(sheepdog, nodes, fileGuid);
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

  fileNode = {
    did: fileGuid,
    data: {
      md5sum: fileMd5,
      file_size: fileSize
    }
  };

  // wait for the indexd listener to add size, hashes and URL to the record
  await waitForIndexdListener(indexd, fileNode);

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
  /////////
  // TODO: uncomment when the gen3 client's new release is set up in jenkins
  /////////
  // configure the gen3-client
  // dataClient.do.configureClient(fence, users, files);

  // clean up in sheepdog
  await sheepdog.complete.findDeleteAllNodes();

  // generate a file name unique to this session
  let rand = (Math.random() + 1).toString(36).substring(2,7); // 5 random chars
  fileName = `qa-upload-file_${rand}.txt`;
  filePath = './' + fileName;

  // create a local file to upload and store its size and hash
  await files.createTmpFile(filePath, fileContents);
  fileSize = await files.getFileSize(filePath);
  fileMd5 = await files.getFileHash(filePath);

  // clean up in indexd (remove the records created by this test suite)
  // TODO: remove
  // await indexd.do.deleteTestFiles(fileName);
});

AfterSuite(async (files, indexd) => {
  // delete the temp file from local storage
  if (fs.existsSync(filePath)) {
    files.deleteFile(filePath);
  }

  // clean up in indexd and S3 (remove the records created by this test suite)
  console.log('deleting: ' + createdGuids); // TODO: remove this debug log
  await indexd.complete.deleteFiles(createdGuids);
  await deleteFromS3(createdGuids);
});

Before((nodes) => {
  // Refresh nodes before every test to clear any appended results, id's, etc
  nodes.refreshPathNodes();
});

After(async (sheepdog) => {
  // clean up in sheepdog
  await sheepdog.complete.findDeleteAllNodes();
});

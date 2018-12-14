const fs = require('fs')

const { sleep } = require('../../utils/apiUtil.js');


Feature('Data file upload flow');


/////////////
// GLOBALS //
/////////////

const dataClientProfileName = 'qa-user';
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
  let token = users.mainAcct.accessTokenHeader;
  let res = await fence.do.getUrlForDataUpload(fileName, token);
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
  const timeout = 20; // max number of seconds to wait
  for (var i = 0; i < timeout; i++) {
    try {
      // check if indexd was updated with the correct hash and size
      await indexd.complete.checkFile(fileNode);
      return;
    }
    catch (e) {
      await sleep(1000);
    }
  }
  throw new Error(`The indexd listener did not complete the record after ${timeout} seconds`);
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
  let fileNode = {
    did: fileGuid
  };
  await indexd.complete.checkRecord(fileNode);

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

  // delete file in bucket (?)
});

/**
 * This time, use the gen3 data client to upload and download the file
 */
Scenario('File upload and download via client', async (dataClient, indexd, nodes) => {
  // use gen3 client to upload a file (TODO: upload-new does not exist yet)
  // fileGuid = dataClient.do.upload_file(dataClientProfileName, filePath);

  // // TODO: set to GUID returned from upload
  // var fileGuid = '65817c30-ee9c-44e1-81e6-c44a1fbeda3b';
  // fileSize = 5; // TODO remove
  // fileMd5 = '003396a33b18d21379c19cc405273910'; // TODO remove
  //
  // // check if correct hash and size in indexd
  // fileNode = nodes.getNodeFromData({
  //   did: fileGuid,
  //   file_size: fileSize,
  //   md5sum: fileMd5,
  //   type: 'submitted_unaligned_reads',
  // });
  // await indexd.complete.checkFile(fileNode);



  // TODO: download the file via the data client
  // TODO: download before metadata linking OK??
  // fileName = 'someFileDestination.txt';
  // dataClient.do.download_file(dataClientProfileName, fileGuid, fileName);
  // if (!require('fs').existsSync(fileName)) {
  //   throw new Error(`Download failed for ${fileGuid}`)
  // }
});

/**
 * Upload a file, link metadata to it via sheepdog and download it
 */
Scenario('Link metadata to file and download', async (sheepdog, indexd, nodes, users, fence) => {
  // request a  presigned URL from fence
  let fenceUploadRes = await getUploadUrlFromFence(fence, users, indexd);
  let fileGuid = fenceUploadRes.body.guid;
  // createdGuids.push(fileGuid); // TODO: delete after metatada submission
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
  let sheepdog_res = await submitFileMetadata(sheepdog, nodes, fileGuid);
  await sheepdog.ask.addNodeSuccess(sheepdog_res);

  // download the file via fence
  var signedUrlRes = await fence.do.createSignedUrl(fileGuid);
  await fence.complete.checkFileEquals(
    signedUrlRes,
    fileContents,
  );

  // check that a user who is not the uploader can download the file
  let auxUserToken = users.auxAcct1.accessTokenHeader;
  signedUrlRes = await fence.do.createSignedUrl(fileGuid, userToken=auxUserToken);
  await fence.complete.checkFileEquals(
    signedUrlRes,
    fileContents,
  );
});

/**
 * The linking should fail
 */
Scenario('Link metadata to file that already has metadata', async () => {

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
  let sheepdog_res = await submitFileMetadata(sheepdog, nodes, fileGuid);
  await sheepdog.ask.hasStatusCode(sheepdog_res.addRes, 400);

  // check that we CANNOT download the file
  // TODO: should uploader be able to download before linking, but not others?
  const signedUrlRes = await fence.do.createSignedUrl(fileGuid);
  await fence.ask.hasNoUrl(signedUrlRes);
});

/**
 * The download should fail (??)
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

  // download the file via fence
  const signedUrlRes = await fence.do.createSignedUrl(fileGuid);
  await fence.complete.checkFileEquals(
    signedUrlRes,
    fileContents,
  );

  // check that a user who is not the uploader CANNOT download the file
  let auxUserToken = users.auxAcct1.accessTokenHeader;
  signedUrlRes = await fence.do.createSignedUrl(fileGuid, userToken=auxUserToken);
  // TODO change this:
  await fence.complete.checkFileEquals(
    signedUrlRes,
    fileContents,
  );
});

Scenario('Data deletion', async () => {
  // upload file
  // delete file
  // no match in indexd after delete
  // no download after delete
  // no metadata linking after delete

  // upload file
  // link to metadata
  // delete file --> should this work?
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
  // createdGuids.push(fileGuid); // TODO: delete after metatada submission
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
  let sheepdog_res = await submitFileMetadata(sheepdog, nodes, fileGuid);
  await sheepdog.ask.addNodeSuccess(sheepdog_res);

  // check that the file can be downloaded
  let signedUrlRes = await fence.do.createSignedUrl(fileGuid);
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
  // createdGuids.push(fileGuid); // TODO: delete after metatada submission
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
  await sheepdog.ask.addNodeSuccess(metadata);

  // check that the file can be downloaded
  signedUrlRes = await fence.do.createSignedUrl(fileGuid);
  await fence.complete.checkFileEquals(
    signedUrlRes,
    fileContents,
  );
});

BeforeSuite(async (dataClient, fence, users, sheepdog, indexd, files) => {
  // configure gen3-client: temporary solution
  // dataClient.do.configure_client(fence, users, dataClientProfileName);

  // clean up in sheepdog
  await sheepdog.complete.findDeleteAllNodes();

  // TODO: use a random name unique to this session
  fileName = 'qa-upload-file.txt';
  filePath = './' + fileName;

  // create a local file to upload and store its size and hash
  await files.createTmpFile(filePath, fileContents);
  fileSize = await files.getFileSize(filePath);
  fileMd5 = await files.getFileHash(filePath);

  // clean up in indexd (remove the records created by this test suite)
  // await indexd.do.deleteTestFiles(fileName);
});

AfterSuite(async (files, fence) => {
  // delete the temp file from local storage
  if (fs.existsSync(filePath)) {
    files.deleteFile(filePath);
  }

  // clean up in indexd and S3 (remove the records created by this test suite)
  console.log('deleting: ' + createdGuids); // TODO: remove this debug log
  await fence.complete.deleteFiles(createdGuids);
});

Before((nodes) => {
  // Refresh nodes before every test to clear any appended results, id's, etc
  nodes.refreshPathNodes();
});

After(async (sheepdog) => {
  // clean up in sheepdog
  await sheepdog.complete.findDeleteAllNodes();
});

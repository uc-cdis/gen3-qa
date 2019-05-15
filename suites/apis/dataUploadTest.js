const chai = require('chai');
const fs = require('fs');

const expect = chai.expect;


Feature('Data file upload flow');

/////////////
// GLOBALS //
/////////////

// maintain a list of GUIDs to delete in indexd and the S3 bucket at the end
let createdGuids = [];

const fileContents = 'this fake data file was generated and uploaded by the integration test suite\n';

// the following variables are set as part of the BeforeSuite step:
let fileName, filePath, fileSize, fileMd5;
let bigFileName, bigFileSize, bigFileMd5, bigFileContents, bigFileParts;


////////////////////
// UTIL FUNCTIONS //
////////////////////

/**
 * request a  presigned URL from fence
 */
const getUploadUrlFromFence = async function (fence, users) {
  let accessHeader = users.mainAcct.accessTokenHeader;
  let res = await fence.do.getUrlForDataUpload(fileName, accessHeader);
  fence.ask.hasUrl(res);
  return res;
};

/**
 * Complete data upload flow using API calls
 * - Use fence to upload a file to S3
 * - Check that we cannot link metadata to a file without hash and size
 * - check that the indexd listener updates the record with the correct hash and size
 * - Link metadata to the file via sheepdog
 * - Download the file via fence and check who can download and when
 */
Scenario('File upload and download via API calls @dataUpload', async (fence, users, nodes, indexd, sheepdog, dataUpload) => {
  // request a  presigned URL from fence
  let fenceUploadRes = await getUploadUrlFromFence(fence, users);
  let fileGuid = fenceUploadRes.body.guid;
  createdGuids.push(fileGuid);
  let presignedUrl = fenceUploadRes.body.url;

  // check that a (blank) record was created in indexd
  let fileNode = {
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
  let sheepdogRes = await nodes.submitGraphAndFileMetadata(sheepdog, nodes, fileGuid, fileSize, fileMd5);
  sheepdog.ask.hasStatusCode(sheepdogRes.addRes, 400, 'Linking metadata to file without hash and size should not be possible');

  // check that we CANNOT download the file (there is no URL in indexd yet)
  let signedUrlRes = await fence.do.createSignedUrlForUser(fileGuid);
  fence.ask.hasNoUrl(signedUrlRes);

  // now, upload the file to the S3 bucket using the presigned URL
  await dataUpload.uploadFileToS3(presignedUrl, filePath, fileSize);

  // wait for the indexd listener to add size, hashes and URL to the record
  await dataUpload.waitUploadFileUpdatedFromIndexdListener(indexd, fileNode);

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

  // submit metadata for this file
  sheepdogRes = await nodes.submitGraphAndFileMetadata(sheepdog, nodes, fileGuid, fileSize, fileMd5);
  sheepdog.ask.addNodeSuccess(sheepdogRes);

  // a user who is not the uploader can now download the file
  signedUrlRes = await fence.do.createSignedUrlForUser(fileGuid, userToken=users.auxAcct1.accessTokenHeader);
  await fence.complete.checkFileEquals(
    signedUrlRes,
    fileContents,
  );

  // check that we cannot link metadata to a file that already has metadata:
  // try to submit metadata for this file again
  sheepdogRes = await nodes.submitGraphAndFileMetadata(sheepdog, nodes, fileGuid, fileSize, fileMd5, submitter_id='submitter_id_new_value');
  sheepdog.ask.addNodeSuccess(sheepdogRes);
}).retry(2);

/**
 * A user who does not have upload access should not be able to upload
 * or download files
 */
Scenario('User without role cannot upload @dataUpload', async (fence, users) => {
  // this user does not have the appropriate role
  let token = users.auxAcct1.accessTokenHeader;

  // request a  presigned URL from fence
  let fenceUploadRes = await fence.do.getUrlForDataUpload(fileName, token);

  // fence should not let this user upload
  fence.ask.hasNoUrl(fenceUploadRes);
  fence.ask.assertStatusCode(fenceUploadRes, 403, 'This user should not be able to download');
}).retry(2);

/**
 * This time, use the gen3 data client to upload and download the file
 * 
 * Disabled in run-tests.sh for now - dataClient manages configuration
 * in a shared home directory folder - need to add locking, or make
 * the config folder configurable ...
 *     
 */
Scenario('File upload and download via client @dataClientCLI @dataUpload', async (dataClient, fence, users, indexd, files, dataUpload) => {
  // configure the gen3-client
  await dataClient.do.configureClient(fence, users, files);

  // use gen3 client to upload a file
  let fileGuid = await dataClient.do.uploadFile(filePath);
  createdGuids.push(fileGuid);

  // check that a (blank) record was created in indexd
  let fileNode = {
    did: fileGuid,
    data: {
      md5sum: fileMd5,
      file_size: fileSize
    }
  };
  await indexd.complete.checkRecordExists(fileNode);

  // wait for the indexd listener to add size, hashes and URL to the record
  await dataUpload.waitUploadFileUpdatedFromIndexdListener(indexd, fileNode);

  // download the file via the data client
  downloadPath = './tmpFileDestination.txt';
  await dataClient.complete.downloadFile(files, fileGuid, downloadPath, fileContents);
});

/**
 * Upload a file, then delete it through fence. Aftert deletion, the file
 * should not be accessible for metadata linking or download
 */
Scenario('Data file deletion @dataUpload', async (fence, users, indexd, sheepdog, nodes, dataUpload) => {
  // request a  presigned URL from fence
  let fenceUploadRes = await getUploadUrlFromFence(fence, users);
  let fileGuid = fenceUploadRes.body.guid;
  let presignedUrl = fenceUploadRes.body.url;

  // upload the file to the S3 bucket using the presigned URL
  await dataUpload.uploadFileToS3(presignedUrl, filePath, fileSize);

  let fileNode = {
    did: fileGuid,
    data: {
      md5sum: fileMd5,
      file_size: fileSize
    }
  };

  // wait for the indexd listener to add size, hashes and URL to the record
  await dataUpload.waitUploadFileUpdatedFromIndexdListener(indexd, fileNode);

  // check that a user who is not the uploader cannot delete the file
  let fenceRes = await fence.do.deleteFile(fileGuid, userHeader=users.auxAcct1.accessTokenHeader);
  fence.ask.assertStatusCode(fenceRes, 403, 'File deletion from user who is not file uploader should not be possible');

  // delete the file
  await fence.complete.deleteFile(fileGuid);

  // no match in indexd after delete
  let indexdRes = await indexd.do.getFile(fileNode);
  indexd.ask.resultFailure(indexdRes);

  // no metadata linking after delete
  let sheepdogRes = await nodes.submitGraphAndFileMetadata(sheepdog, nodes, fileGuid, fileSize, fileMd5);
  sheepdog.ask.hasStatusCode(sheepdogRes.addRes, 400, 'Metadata linking should not be possible after file deletion');

  // no download after delete
  let signedUrlRes = await fence.do.createSignedUrlForUser(fileGuid);
  fence.ask.assertStatusCode(signedUrlRes, 404, 'File download should not be possible after file deletion');
});

/**
 * Upload 2 files with the same contents (so same hash and size) and
 * link metadata to them via sheepdog
 */
Scenario('Upload the same file twice @dataUpload', async (sheepdog, indexd, nodes, users, fence, dataUpload) => {
  ////////////
  // FILE 1 //
  ////////////

  // request a  presigned URL from fence
  let fenceUploadRes = await getUploadUrlFromFence(fence, users);
  let fileGuid = fenceUploadRes.body.guid;
  createdGuids.push(fileGuid);
  let presignedUrl = fenceUploadRes.body.url;

  // upload the file to the S3 bucket using the presigned URL
  await dataUpload.uploadFileToS3(presignedUrl, filePath, fileSize);

  let fileNode = {
    did: fileGuid,
    data: {
      md5sum: fileMd5,
      file_size: fileSize
    }
  };

  // wait for the indexd listener to add size, hashes and URL to the record
  await dataUpload.waitUploadFileUpdatedFromIndexdListener(indexd, fileNode);

  // submit metadata for this file
  let sheepdogRes = await nodes.submitGraphAndFileMetadata(sheepdog, nodes, fileGuid, fileSize, fileMd5);
  sheepdog.ask.addNodeSuccess(sheepdogRes, 'first upload');

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
  fenceUploadRes = await getUploadUrlFromFence(fence, users);
  fileGuid = fenceUploadRes.body.guid;
  createdGuids.push(fileGuid);
  presignedUrl = fenceUploadRes.body.url;

  // upload the file to the S3 bucket using the presigned URL
  await dataUpload.uploadFileToS3(presignedUrl, filePath, fileSize);

  // wait for the indexd listener to add size, hashes and URL to the record
  fileNode.did = fileGuid;
  await dataUpload.waitUploadFileUpdatedFromIndexdListener(indexd, fileNode);

  // submit metadata for this file
  sheepdogRes = await nodes.submitGraphAndFileMetadata(sheepdog, nodes, fileGuid, fileSize, fileMd5, submitter_id='submitter_id_new_value');
  sheepdog.ask.addNodeSuccess(sheepdogRes, 'second upload');

  // check that the file can be downloaded
  signedUrlRes = await fence.do.createSignedUrlForUser(fileGuid);
  await fence.complete.checkFileEquals(
    signedUrlRes,
    fileContents,
  );
}).retry(2);

/**
 * Use fence's multipart upload endpoints to upload a large data file (>5MB)
 */
Scenario('Successful multipart upload', async (users, fence, indexd, dataUpload) => {
  // initialize the multipart upload
  console.log("Initializing multipart upload");
  const accessHeader = users.mainAcct.accessTokenHeader;
  const initRes = await fence.complete.initMultipartUpload(bigFileName, accessHeader);
  const fileGuid = initRes.guid;
  createdGuids.push(fileGuid);
  const key = `${fileGuid}/${bigFileName}`;

  // upload each file part to the S3 bucket
  let partsSummary = [];
  for (var partNumber = 1; partNumber <= Object.keys(bigFileParts).length; partNumber++) {
    console.log(`Uploading file part ${partNumber}`);

    // get a presigned URL from fence
    let getUrlRes = await fence.complete.getUrlForMultipartUpload(key, initRes.uploadId, partNumber, accessHeader);

    // upload the file part using the presigned URL
    const uploadPartRes = await dataUpload.uploadFilePartToS3(
      getUrlRes.url,
      bigFileParts[partNumber]
    );

    partsSummary.push({
      PartNumber: partNumber,
      ETag: uploadPartRes
    });
  }

  // complete the multipart upload
  console.log("Completing multipart upload");
  await fence.complete.completeMultipartUpload(key, initRes.uploadId, partsSummary, accessHeader);

  // wait for the indexd listener to add size, hashes and URL to the record
  let fileNode = {
    did: fileGuid,
    data: {
      md5sum: bigFileMd5,
      file_size: bigFileSize
    }
  };
  await dataUpload.waitUploadFileUpdatedFromIndexdListener(indexd, fileNode);

  // download the file
  console.log("Downloading the file");
  const signedUrlRes = await fence.do.createSignedUrlForUser(fileGuid);
  fence.ask.assertStatusCode(signedUrlRes, 200, "Could not get signed URL for file download after completing multipart upload");
  fence.complete.checkFileEquals(signedUrlRes, bigFileContents.toString());
}).retry(2);

/**
 * Use fence's multipart upload endpoints to upload a large data file (>5MB).
 * Fail to complete the upload because of a wrong ETag input
 */
Scenario('Failed multipart upload: wrong ETag for completion', async (users, fence, dataUpload) => {
  // initialize the multipart upload
  console.log("Initializing multipart upload");
  const accessHeader = users.mainAcct.accessTokenHeader;
  const initRes = await fence.complete.initMultipartUpload(bigFileName, accessHeader);
  const fileGuid = initRes.guid;
  createdGuids.push(fileGuid);
  const key = `${fileGuid}/${bigFileName}`;

  // upload each file part to the S3 bucket
  let partsSummary = [];
  for (var partNumber = 1; partNumber <= Object.keys(bigFileParts).length; partNumber++) {
    console.log(`Uploading file part ${partNumber}`);

    // get a presigned URL from fence
    let getUrlRes = await fence.complete.getUrlForMultipartUpload(key, initRes.uploadId, partNumber, accessHeader);

    // upload the file part using the presigned URL
    const uploadPartRes = await dataUpload.uploadFilePartToS3(
      getUrlRes.url,
      bigFileParts[partNumber]
    );

    partsSummary.push({
      PartNumber: partNumber,
      ETag: `${uploadPartRes}fake` // wrong ETag
    });
  }

  // complete the multipart upload
  console.log("Trying to complete multipart upload");
  const completeRes = await fence.do.completeMultipartUpload(key, initRes.uploadId, partsSummary, accessHeader);
  expect(completeRes, 'Should not have been able to complete multipart upload with wrong ETags').to.have.property('statusCode', 400);

  // try to download the file
  console.log("Try to download the file");
  const signedUrlRes = await fence.do.createSignedUrlForUser(fileGuid);
  fence.ask.assertStatusCode(signedUrlRes, 404, "Should not be able to get signed URL for file download when multipart upload completion failed");
}).retry(2);

BeforeSuite(async (sheepdog, files) => {
  // clean up in sheepdog
  await sheepdog.complete.findDeleteAllNodes();

  // generate file names unique to this session
  let rand = (Math.random() + 1).toString(36).substring(2,7); // 5 random chars
  fileName = `qa-upload-file_${rand}.txt`;
  filePath = './' + fileName;
  bigFileName = `qa-upload-7mb-file_${rand}.txt`;

  // create a local small file to upload. store its size and hash
  await files.createTmpFile(filePath, fileContents);
  fileSize = files.getFileSize(filePath);
  fileMd5 = await files.getFileHash(filePath);

  // create a local large file (size 7MB)
  await files.createBigTmpFile(bigFileName, 7);
  bigFileSize = files.getFileSize(bigFileName);
  bigFileMd5 = await files.getFileHash(bigFileName);

  // each part of the large file must be >=5MB (except the last part)
  bigFileContents = fs.readFileSync(bigFileName);
  const fiveMbLength = Math.floor(bigFileContents.length * 5/7);
  bigFileParts = {
    1: bigFileContents.slice(0, fiveMbLength),
    2: bigFileContents.slice(fiveMbLength)
  };
});

AfterSuite(async (files, indexd, dataUpload) => {
  // delete the temp files from local storage
  if (fs.existsSync(filePath)) {
    files.deleteFile(filePath);
  }
  if (fs.existsSync(bigFileName)) {
    files.deleteFile(bigFileName);
  }

  // clean up in indexd and S3 (remove the records created by this test suite)
  // Note: we don't use fence's /delete endpoint here because it does not allow
  // deleting from indexd records that have already been linked to metadata
  await indexd.complete.deleteFiles(createdGuids);
  await dataUpload.cleanS3(fileName, createdGuids);
});

Before((nodes) => {
  // Refresh nodes before every test to clear any appended results, id's, etc
  nodes.refreshPathNodes();
});

After(async (sheepdog) => {
  // clean up in sheepdog
  await sheepdog.complete.findDeleteAllNodes();
});

const fs = require('fs')

const { sleep } = require('../../utils/util.js');


Feature('Data file upload flow');


const dataClientProfileName = 'qa-user';
const fileToUploadPath = './qa-upload-file.txt'; // TODO: use a random name unique to this session

// the following global variables are set as part of the BeforeSuite step:
var fileName, fileSize, fileMd5;

// request a  presigned URL from fence
const getUploadUrlFromFence = async function (fence, users, indexd) {
  let token = users.mainAcct.accessTokenHeader;
  let res = await fence.do.getUrlForDataUpload(fileName, token);
  fence.ask.hasUrl(res);
  return res;
};

// upload a file to an S3 bucket using a presigned URL
const uploadFileToS3 = async function (presignedUrl) {
  fs.createReadStream(fileToUploadPath).pipe(require('request')({
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

// TODO: check if the file is in the bucket
const checkFileInS3 = async function () {
  // var params = {
  //   Bucket: config.get('s3bucket'),
  //   Key: path
  // };
  // url = 'https://qaplanetv1-data-bucket.s3.amazonaws.com/52c57a22-2316-433a-8b4a-e58808ec1123/qa-upload-file.txt'
  // s3.headObject(params, function (err, metadata) {
  //   if (err && err.code === 'NotFound') {
  //     // Handle no object on cloud here
  //   } else {
  //     s3.getSignedUrl('getObject', params, callback);
  //   }
  // });

  // const I = actor();
  // I.sendGetRequest(
  //   ',
  // ).then((res) => {
  //   console.log(res.body)
  //   return res.body;
  // });
  // require('https').get(, (resp) => {
  //   let data = '';
  //
  //   // A chunk of data has been recieved.
  //   resp.on('data', (chunk) => {
  //     data += chunk;
  //   });
  //
  //   // The whole response has been received. Print out the result.
  //   resp.on('end', () => {
  //     console.log(JSON.parse(data).explanation);
  //   });
  //
  // }).on("error", (err) => {
  //   console.log("Error: " + err.message);
  // });
};

/**
 *
 */
const waitForIndexdListener = async function(indexd, fileNode) {
  let i = 0;
  const stop = 15; // max number of seconds to wait
  while (i < stop) {
    try {
      // check if indexd was updated with the correct hash and size
      await indexd.complete.checkFile(fileNode);
      return;
    }
    catch (e) {
      await sleep(1000);
      i++;
    }
  }
  throw new Error(`The indexd listener did not complete the record after ${stop} seconds`);
};

// link metadata to an indexd file via sheepdog
//!\\ this function does not include a check for success or failure of the submission
const submitFileMetadata = async function (sheepdog, nodes, fileGuid) {
  // prepare graph for metadata upload (upload parent nodes)
  await sheepdog.complete.addNodes(nodes.getPathToFile());

  // submit metadata with object id via sheepdog
  metadata = nodes.getFileNode().clone();
  metadata.data.object_id = fileGuid;
  metadata.data.file_size = fileSize;
  metadata.data.md5sum = fileMd5;
  await sheepdog.do.addNode(metadata);

  // the result of the submission is stored in metadata.addRes by addNode()
  return metadata;
};


Scenario('File upload via API calls', async (fence, users, nodes, indexd) => {
  // request a  presigned URL from fence
  let fenceUploadRes = await getUploadUrlFromFence(fence, users, indexd);
  let fileGuid = fenceUploadRes.body.guid;
  let presignedUrl = fenceUploadRes.body.url;

  await checkFileInS3();

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

Scenario('File upload via client', async (dataClient, indexd, nodes) => {
  // use gen3 client to upload a file (TODO: upload-new does not exist yet)
  // fileGuid = dataClient.do.upload_file(dataClientProfileName, fileToUploadPath);

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
});

Scenario('Link metadata to file and download', async (sheepdog, indexd, nodes, users, fence) => {
  // request a  presigned URL from fence
  let fenceUploadRes = await getUploadUrlFromFence(fence, users, indexd);
  let fileGuid = fenceUploadRes.body.guid;
  let presignedUrl = fenceUploadRes.body.url;

  // upload the file to the S3 bucket using the presigned URL
  await uploadFileToS3(presignedUrl);

  let fileNode = {
    did: fileGuid,
    data: {
      md5sum: fileMd5,
      file_size: fileSize,
      urls: 'url-to-file-in-s3'
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

  // check that uploader and acl have been updated in indexd
  let indexd_record = await indexd.do.getFile(fileNode);
  indexd.ask.metadataLinkingSuccess(indexd_record);

  // try downloading
  // TODO: also try with different user

  // API call
  // const signedUrlRes = await fence.do.createSignedUrl(fileGuid);
  // await fence.complete.checkFileEquals(
  //   signedUrlRes,
  //   'this fake data file was generated and uploaded by the integration test suite\n',
  // );

  // // data client
  // fileName = 'someFileDestination.txt';
  // dataClient.do.download_file(dataClientProfileName, fileGuid, fileName);
  // if (!require('fs').existsSync(fileName)) {
  //   throw new Error(`Download failed for ${fileGuid}`)
  // }
});

/**
 * The linking should fail
 */
Scenario('Link metadata to file that already has metadata', async () => {

});

/**
 * The linking should fail
 */
Scenario('Link metadata to file without hash and size', async (users, fence, sheepdog, nodes, indexd) => {
 // request a  presigned URL from fence
 let fenceUploadRes = await getUploadUrlFromFence(fence, users, indexd);
 let fileGuid = fenceUploadRes.body.guid;
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

 // check that uploader and acl have NOT been updated in indexd
 let indexd_record = await indexd.do.getFile(fileNode);
 indexd.ask.metadataLinkingFailure(indexd_record);
});

/**
 * The download should fail
 */
Scenario('Download before metadata linking', async () => {
  // register files, but no metadata

  // try downloading by this user and by another user

});

Scenario('Data deletion', async () => {
  // upload file
  // delete file
  // no match in indexd after delete
  // no download after delete
  // no metadata linking after delete
});

Scenario('Upload the same file twice', async (sheepdog, indexd, nodes, users, fence) => {
  ////////////
  // FILE 1 //
  ////////////

  // request a  presigned URL from fence
  let fenceUploadRes = await getUploadUrlFromFence(fence, users, indexd);
  let fileGuid = fenceUploadRes.body.guid;
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

  // check that uploader and acl have been updated in indexd
  let indexd_record = await indexd.do.getFile(fileNode);
  indexd.ask.metadataLinkingSuccess(indexd_record);

  ////////////
  // FILE 2 //
  ////////////

  // request a  presigned URL from fence
  fenceUploadRes = await getUploadUrlFromFence(fence, users, indexd);
  fileGuid = fenceUploadRes.body.guid;
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

  // check that uploader and acl have been updated in indexd
  indexd_record = await indexd.do.getFile(fileNode);
  indexd.ask.metadataLinkingSuccess(indexd_record);
});

BeforeSuite(async (dataClient, fence, users, sheepdog, indexd, files) => {
  // configure gen3-client: temporary solution
  // dataClient.do.configure_client(fence, users, dataClientProfileName);

  // clean up in sheepdog
  await sheepdog.complete.findDeleteAllNodes();

  // create a file to upload and store the size and hash
  await files.createTmpFile(fileToUploadPath);
  fileSize = await files.getFileSize(fileToUploadPath);
  fileMd5 = await files.getFileHash(fileToUploadPath);

  // get file name from file path
  fileName = fileToUploadPath.split('/').pop();

  // clean up in indexd (remove the records created by this test suite)
  await indexd.do.deleteTestFiles(fileName);
});

AfterSuite(async (files) => {
  // delete the temp file
  if (fs.existsSync(fileToUploadPath)) {
    files.deleteFile(fileToUploadPath);
  }
});

Before((nodes) => {
  // Refresh nodes before every test to clear any appended results, id's, etc
  nodes.refreshPathNodes();
});

After(async (sheepdog, indexd) => {
  // clean up in sheepdog
  await sheepdog.complete.findDeleteAllNodes();

  // clean up in indexd (remove the records created by this test suite)
  await indexd.do.deleteTestFiles(fileName);
});

const fs = require('fs')

const fileUtil = require('../../utils/fileUtil.js');

Feature('Data file upload flow');

const dataClientProfileName = 'qa-user';
const fileToUploadPath = './qa-upload-file.txt';
var fileName, fileSize, fileMd5;

Scenario('File upload via API calls', async (fence, users, nodes, indexd) => {
  // get a presigned URL from fence
  let token = users.mainAcct.accessTokenHeader;
  let res = await fence.do.getUrlForDataUpload(fileName, token);
  fence.ask.hasUploadUrl(res);
  // console.log(res.body.guid)
  // console.log(res.body.url)

  // check that a (blank) record was created in indexd
  // if success, 'rev' is added to the fileNode
  fileNode = {
    did: res.body.guid
  };
  await indexd.complete.checkRecord(fileNode);

  // upload the file to the S3 bucket using the presigned URL
  // console.log(res.body.url)
  fs.createReadStream(fileToUploadPath).pipe(require('request')({
    method: 'PUT',
    url: res.body.url,
    headers: {
      'Content-Length': fileSize
    }
  }, function (err, res, body) {
    if (err) {
      throw new Error(err);
    }
    // console.log('Successfully uploaded file to bucket');
  }));

  // check if the file is in the bucket
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

  // TODO: Remove when indexd-listener works
  fileNode = {
    did: res.body.guid,
    data: {
      md5sum: fileMd5,
      file_size: fileSize
    }
  };
  await indexd.do.getFile(fileNode); // add 'rev' to fileNode
  var indexd_res = await indexd.complete.updateBlankRecord(fileNode);

  // check if indexd was updated with the correct hash and size
  await indexd.complete.checkFile(fileNode);

  // clean up in indexd
  // this is possible because 'rev' was added to fileNode by checkRecord()
  await indexd.complete.deleteFile(fileNode);

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

  // clean up in indexd

});

Scenario('Link metadata to file and download', async (dataClient, sheepdog, indexd, nodes, users, fence) => {
  // upload a file

  // when data-client works: remove users & fence params
  // fileGuid = dataClient.do.upload_file(dataClientProfileName, fileToUploadPath);
  let token = users.mainAcct.accessTokenHeader;
  let fence_res = await fence.do.getUrlForDataUpload(fileName, token);
  fence.ask.hasUploadUrl(fence_res);
  // upload the file to the S3 bucket using the presigned URL
  fs.createReadStream(fileToUploadPath).pipe(require('request')({
    method: 'PUT',
    url: fence_res.body.url,
    headers: {
      'Content-Length': fileSize
    }
  }, function (err, fence_res, body) {
    if (err) {
      throw new Error(err);
    }
  }));
  var fileGuid = fence_res.body.guid;

  // TODO: Remove when indexd-listener works
  fileNode = {
    did: fileGuid,
    data: {
      md5sum: fileMd5,
      file_size: fileSize
    }
  };
  await indexd.do.getFile(fileNode); // add 'rev' to fileNode
  var indexd_res = await indexd.complete.updateBlankRecord(fileNode);

  // prepare graph for metadata upload (upload parent nodes)
  await sheepdog.complete.addNodes(nodes.getPathToFile());

  // submit metadata with object id via sheepdog
  metadataFile = nodes.getFileNode().clone();
  metadataFile.data.object_id = fileGuid;
  metadataFile.data.file_size = fileSize;
  metadataFile.data.md5sum = fileMd5;
  await sheepdog.complete.addNode(metadataFile);

  // check that uploader and acl have been updated in indexd
  indexd_record = await indexd.do.getFile(fileNode);
  indexd.ask.metadataLinkingSuccess(indexd_record);

  // try downloading
  // TODO: also try with different user
  // fileName = 'someFileDestination.txt';
  // dataClient.do.download_file(dataClientProfileName, fileGuid, fileName);
  // if (!require('fs').existsSync(fileName)) {
  //   throw new Error(`Download failed for ${fileGuid}`)
  // }
  // fileUtil.deleteFile(fileName);

  // clean up in sheepdog
  await sheepdog.complete.findDeleteAllNodes();

  // clean up in indexd
  await indexd.complete.deleteFile(fileNode);

});

/**
 * The linking should fail
 */
Scenario('Link metadata to file that already has metadata', async () => {

});

/**
 * The linking should fail
 */
Scenario('Link metadata to file without hash and size', async () => {

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

BeforeSuite(async (dataClient, fence, users, sheepdog, indexd) => {
  // configure gen3-client: temporary solution
  // dataClient.do.configure_client(fence, users, dataClientProfileName);

  // clean up in sheepdog
  await sheepdog.complete.findDeleteAllNodes();

  // create a file to upload and store the size and hash
  await fileUtil.createTmpFile(fileToUploadPath);
  if (!fs.existsSync(fileToUploadPath)) {
    console.log('The temp file was not created');
  }
  // const hash = require('crypto').createHash('md5').update(data).digest();
  // console.log(hash);
  fileSize = await fileUtil.getFileSize(fileToUploadPath);
  fileMd5 = await fileUtil.getFileHash(fileToUploadPath);
  if (fileSize == 0) {
    console.log('*** WARNING: file size is 0'); // TODO remove
  }
  // get file name from file path
  fileName = fileToUploadPath.split('/').pop();

  // clean up in indexd (remove the records created by this test suite)
  await indexd.do.deleteTestFiles(fileName);
});

AfterSuite(async (sheepdog, indexd) => {
  // clean up in sheepdog
  await sheepdog.complete.findDeleteAllNodes();

  // delete the temp file
  if (fs.existsSync(fileToUploadPath)) {
    fileUtil.deleteFile(fileToUploadPath);
  }

  // clean up in indexd (remove the records created by this test suite)
  await indexd.do.deleteTestFiles(fileName);
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

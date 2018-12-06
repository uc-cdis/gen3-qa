const fs = require('fs')

const fileUtil = require('../../utils/fileUtil.js');

Feature('Data file upload flow');

const dataClientProfileName = 'qa-user';
const fileToUploadPath = './qa-upload-file.txt';
var fileSize, fileMd5;

Scenario('File upload via API calls', async (fence, users, nodes, indexd) => {
  // get file name from file path
  var pathParts = fileToUploadPath.split('/');
  var fileToUploadName = pathParts.pop();

  // get a presigned URL from fence
  let token = users.mainAcct.accessTokenHeader;
  let res = await fence.do.getUrlForDataUpload(fileToUploadName, token);
  fence.ask.hasUploadUrl(res);

  // check that a (blank) record was created in indexd
  // if success, 'rev' is added to the fileNode data
  fileNode = {
    data: {
      did: res.body.guid
    }
  };
  await indexd.complete.checkRecord(fileNode);

  // upload the file to the S3 bucket using the presigned URL
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
    console.log('Successfully uploaded file to bucket');
  }));

  // check if the file is in the bucket

  // check if indexd was updated with the correct hash and size
  // TODO: the check fails because the indexd listener is not set up
  // await indexd.complete.checkFile(fileNode);

  // delete file in indexd
  // 'rev' was added to fileNode by checkRecord()
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

  // delete file in indexd

});

Scenario('Link file to metadata and download', async (dataClient, sheepdog, indexd, nodes) => {
  // upload a file
  // fileGuid = dataClient.do.upload_file(dataClientProfileName, fileToUploadPath);

  // // prepare graph for metadata upload (upload parent nodes)
  // await sheepdog.complete.addNodes(nodes.getPathToFile());
  //
  // // submit metadata with object id via sheepdog TODO: use real values
  // metadataFile = nodes.getFileNode().clone();
  // // metadataFile.data.object_id = fileGuid;
  // metadataFile.data.file_size = fileSize;
  // metadataFile.data.md5sum = fileMd5;
  // await sheepdog.complete.addNode(metadataFile);
  // // await indexd.complete.checkFile(metadataFile); // ??
  //
  // // try downloading
  // // TODO: also try with different user
  // // fileGuid = '1a25798d-44d6-47a3-a0f6-c95e6f17666a'
  // fileName = 'someFileDestination.txt'
  // dataClient.do.download_file(dataClientProfileName, fileGuid, fileName);
  // if (!require('fs').existsSync(fileName)) {
  //   throw new Error(`Download failed for ${fileGuid}`)
  // }
  // fileUtil.deleteFile(fileName);
  //
  // // clean up
  // nodesToDelete = nodes.getPathToFile().push(metadataFile);
  // // await sheepdog.complete.deleteNodes(nodesToDelete);

  // delete file in indexd

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

BeforeSuite(async (dataClient, fence, users, sheepdog) => {
  // configure gen3-client: temporary solution
  // dataClient.do.configure_client(fence, users, dataClientProfileName);

  // clean up any leftover nodes
  await sheepdog.complete.findDeleteAllNodes();

  // create a file to upload and store the size and hash
  await fileUtil.createTmpFile(fileToUploadPath);
  // const hash = require('crypto').createHash('md5').update(data).digest();
  // console.log(hash);
  fileSize = await fileUtil.getFileSize(fileToUploadPath);
  fileMd5 = await fileUtil.getFileHash(fileToUploadPath);
  if (fileSize == 0) {
    console.log('*** WARNING: file size is 0') // TODO remove
  }
});

AfterSuite(() => {
  // delete the temp file
  if (fs.existsSync(fileToUploadPath)) {
    fileUtil.deleteFile(fileToUploadPath);
  }
});

Before((nodes) => {
  // Refresh nodes before every test to clear any appended results, id's, etc
  nodes.refreshPathNodes();
});

After(async (sheepdog) => {
  // clean up any leftover nodes
  await sheepdog.complete.findDeleteAllNodes();
});

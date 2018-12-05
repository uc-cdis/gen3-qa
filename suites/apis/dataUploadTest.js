const fileUtil = require('../../utils/fileUtil.js');

Feature('Data upload flow');

const dataClientProfileName = 'qa-user'
const fileToUploadPath = './qa-upload-file.txt'

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
  var fileSize = await fileUtil.getFileSize(fileToUploadPath);
  var fileMd5 = await fileUtil.getFileHash(fileToUploadPath);
  if (fileSize == 0) {
    console.log('*** WARNING: file size is 0') // TODO remove
  }
});

AfterSuite(() => {
  // delete the temp file
  fileUtil.deleteFile(fileToUploadPath);
});

Before((nodes) => {
  // Refresh nodes before every test to clear any appended results, id's, etc
  nodes.refreshPathNodes();
});

After(async (sheepdog) => {
  // clean up any leftover nodes
  await sheepdog.complete.findDeleteAllNodes();
});

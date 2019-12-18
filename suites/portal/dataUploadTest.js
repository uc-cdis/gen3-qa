Feature('DataUploadTest');

const I = actor();
const createdGuids = [];
const createdFileNames = [];
let submitterID;

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

const uploadFile = async function (dataUpload, indexd, sheepdog, nodes, fileObj, presignedUrl) {
  const { filePath } = fileObj;
  const { fileSize } = fileObj;
  const { fileMd5 } = fileObj;
  const { fileGuid } = fileObj;

  // upload the file to the S3 bucket using the presigned URL
  await dataUpload.uploadFileToS3(presignedUrl, filePath, fileSize);

  // wait for the indexd listener to add size, hashes and URL to the record
  const fileNode = {
    did: fileGuid,
    data: {
      md5sum: fileMd5,
      file_size: fileSize,
    },
  };
  await dataUpload.waitUploadFileUpdatedFromIndexdListener(indexd, fileNode);
};

BeforeSuite(async (sheepdog, nodes, users, fence, indexd) => {
  // clean up in sheepdog
  await sheepdog.complete.findDeleteAllNodes();

  // clean up previous upload files
  await indexd.do.clearPreviousUploadFiles(users.mainAcct);
  await indexd.do.clearPreviousUploadFiles(users.auxAcct2);

  // Add coremetadata node.
  // FIXME: once windmill allow parent nodes other than core-metadata-collection, remove this
  const newSubmitterID = await nodes.generateAndAddCoremetadataNode(sheepdog);
  submitterID = newSubmitterID;
});

Before((home) => {
  home.complete.login();
});

Scenario('Map uploaded files in windmill submission page @dataUpload @portal', async (sheepdog, nodes, files, fence, users, indexd, portalDataUpload, dataUpload) => {
  // generate file and register in fence, get url
  const { fileObj, presignedUrl } = await generateFileAndGetUrlFromFence(files, fence, users.mainAcct.accessTokenHeader);

  // user1 should see 1 file, but not ready yet
  portalDataUpload.complete.checkUnmappedFilesAreInSubmissionPage([fileObj], false);

  // upload file
  await uploadFile(dataUpload, indexd, sheepdog, nodes, fileObj, presignedUrl);

  // user1 should see 1 file ready
  portalDataUpload.complete.checkUnmappedFilesAreInSubmissionPage([fileObj], true);

  // user1 map file in windmill
  await portalDataUpload.complete.mapFiles([fileObj], submitterID);

  // user1 should see 0 files now because all files are mapped.
  portalDataUpload.complete.checkUnmappedFilesAreInSubmissionPage([]);
});

Scenario('Cannot see files uploaded by other users @dataUpload @portal', async (sheepdog, nodes, files, fence, users, indexd, portalDataUpload, dataUpload) => {
  // user2 upload file2
  const { fileObj, presignedUrl } = await generateFileAndGetUrlFromFence(files, fence, users.auxAcct2.accessTokenHeader);
  await uploadFile(dataUpload, indexd, sheepdog, nodes, fileObj, presignedUrl);

  // user1 cannot see file2
  await portalDataUpload.complete.checkUnmappedFilesAreNotInFileMappingPage([fileObj]);
});

After((home) => {
  home.complete.logout();
});

AfterSuite(async (sheepdog, indexd, files, dataUpload) => {
  // clean up in sheepdog
  await sheepdog.complete.findDeleteAllNodes();

  // clean up in indexd and S3 (remove the records created by this test suite)
  await indexd.complete.deleteFiles(createdGuids);
  await dataUpload.cleanS3('clean-windmill-data-upload', createdGuids);
  createdFileNames.forEach((fileName) => {
    files.deleteFile(fileName);
  });
});

Feature('DataUploadTest');

const I = actor();
let createdGuids = [];

const generateFileAndGetUrlFromFence = async function(files, fence, accessTokenHeader) {
  // generate a file unique to this session
  const fileObj = await files.createTmpFileWithRandomeNameAndContent();
  const fileName = fileObj.fileName;
  
  // request a  presigned URL from fence
  const fenceUploadRes = await fence.do.getUrlForDataUpload(fileName, accessTokenHeader);
  fence.ask.hasUrl(fenceUploadRes);
  const fileGuid = fenceUploadRes.body.guid;
  createdGuids.push(fileGuid);
  const presignedUrl = fenceUploadRes.body.url;
  return {
    fileObj: {...fileObj, fileGuid},
    presignedUrl,
  };
};

const uploadFile = async function(files, indexd, fileObj, presignedUrl) {
  const filePath = fileObj.filePath;
  const fileSize = fileObj.fileSize;
  const fileMd5 = fileObj.fileMd5;
  const fileGuid = fileObj.fileGuid;

  // upload the file to the S3 bucket using the presigned URL
  await files.uploadFileToS3(presignedUrl, filePath, fileSize);

  // wait for the indexd listener to add size, hashes and URL to the record
  const fileNode = {
    did: fileGuid,
    data: {
      md5sum: fileMd5,
      file_size: fileSize
    }
  };
  await files.waitUploadFileUpdatedFromIndexdListener(indexd, fileNode);
};

BeforeSuite(async (sheepdog, files, users, fence, indexd) => {
  // clean up in sheepdog
  await sheepdog.complete.findDeleteAllNodes();

  // clean up previous unmapped files
  await indexd.do.clearPreviousUnmappedFiles(users.mainAcct);
  await indexd.do.clearPreviousUnmappedFiles(users.auxAcct2);

  // resize the window for easy debugging
  I.resizeWindow(1920, 1080);
});

Scenario('Map uploaded files in windmill submission page', async (files, fence, users, indexd, portalDataUpload) => {
  // user1 upload file1
  const {fileObj, presignedUrl} = await generateFileAndGetUrlFromFence(files, fence, users.mainAcct.accessTokenHeader);
  await portalDataUpload.complete.checkUnmappedFilesAreInSubmissionPage([fileObj], false);
  await uploadFile(files, indexd, fileObj, presignedUrl);
  await portalDataUpload.complete.checkUnmappedFilesAreInSubmissionPage([fileObj], true);
  portalDataUpload.complete.checkCouldMapFiles([fileObj]);
});

Scenario('Cannot see files uploaded by other users', async(files, fence, users, indexd, portalDataUpload) => {
  // user2 upload file2
  const {fileObj, presignedUrl} = await generateFileAndGetUrlFromFence(files, fence, users.auxAcct2.accessTokenHeader);
  await uploadFile(files, indexd, fileObj, presignedUrl);
  portalDataUpload.complete.checkUnmappedFilesAreNotInFileMappingPage([fileObj]);
});

AfterSuite(async (sheepdog, indexd) => {
  // clean up in sheepdog
  await sheepdog.complete.findDeleteAllNodes();

  // clean up in indexd and S3 (remove the records created by this test suite)
  console.log('deleting: ' + createdGuids); // TODO: remove this debug log
  await indexd.complete.deleteFiles(createdGuids);
  //await deleteFromS3(createdGuids);
});

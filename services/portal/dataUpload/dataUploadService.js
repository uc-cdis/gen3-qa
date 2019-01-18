 const dataUploadTasks = require('./dataUploadTasks.js');
 const dataUploadQuestions = require('./dataUploadQuestions.js');
 const dataUploadProps = require('./dataUploadProps.js');
 const dataUploadSequences = require('./dataUploadSequences.js');

/**
 * dataUpload Service
 */
module.exports = {
   props: dataUploadProps,

   do: dataUploadTasks,

   ask: dataUploadQuestions,

   complete: dataUploadSequences,
};

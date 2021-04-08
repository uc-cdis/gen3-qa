const { Commons } = require('../utils/commons');

async function createProgramAndProjectsForTesting(nAttempts = 3) {
  let success = false;
  for (let i = 0; i < nAttempts; i += 1) {
    if (success === true) {
      break;
    }
    await Commons.createProgramProject()
      .then(() => {         // eslint-disable-line
        console.log(`Successfully created program/project on attempt ${i}`);
        success = true;
      })
      .catch((err) => {
        console.log(
          `Failed to create program/project on attempt ${i}:\n`,
          JSON.stringify(err),
        );
        if (i === nAttempts - 1) {
          throw err;
        }
      });
  }
}

createProgramAndProjectsForTesting();

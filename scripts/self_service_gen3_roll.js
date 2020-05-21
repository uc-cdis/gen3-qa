const { Bash } = require('../utils/bash');

const bash = new Bash();

async function runGen3Roll(serviceName) {
  const cmd1 = await bash.runCommand(`gen3 roll ${serviceName}`);
  console.log(`result: ${cmd1}`);
}

runGen3Roll(process.env.SERVICE_NAME);

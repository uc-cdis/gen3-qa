const { Bash } = require('../utils/bash');

const bash = new Bash();

async function runGen3Roll(serviceName) {
  process.env['NODE_ENV'] = process.env.TARGET_ENVIRONMENT;
  process.env['GEN3_HOME'] = `${require('path').resolve(__dirname, '..')}/cloud-automation`;
  const cmd1 = await  bash.runCommand(`ssh ${process.env.TARGET_ENVIRONMENT}@cdistest_dev.csoc 'set -i; source ~/.bashrc; cd ~/cdis-manifest && git pull && gen3 roll ${serviceName}'`);
  console.log(`result: ${cmd1}`);
}

runGen3Roll(process.env.SERVICE_NAME);

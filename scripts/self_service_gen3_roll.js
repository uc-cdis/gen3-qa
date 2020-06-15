const path = require('path');
const { Bash } = require('../utils/bash');

const bash = new Bash();

async function runGen3Roll(serviceName) {
  process.env.KUBECTL_NAMESPACE = process.env.TARGET_ENVIRONMENT;
  process.env.GEN3_HOME = `${path.resolve(__dirname, '../..')}/cloud-automation`;
  const debug1 = await bash.runCommand('ls && pwd && cd .. && ls -ilha && pwd && ls && cd .. && ls');
  console.log(`result: ${debug1}`);
  const cmd1 = await bash.runCommand(`export KUBECTL_NAMESPACE=${process.env.TARGET_ENVIRONMENT} && gen3 kube-setup-secrets && gen3 roll ${serviceName}`);
  console.log(`result: ${cmd1}`);
}

runGen3Roll(process.env.SERVICE_NAME);

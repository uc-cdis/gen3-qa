const path = require('path');
const { Bash } = require('../utils/bash');

const bash = new Bash();

async function runFrigginETL() {
  process.env.KUBECTL_NAMESPACE = process.env.TARGET_ENVIRONMENT;
  process.env.GEN3_HOME = `${path.resolve(__dirname, '../..')}/cloud-automation`;
  const cmd1 = await bash.runCommand(`export KUBECTL_NAMESPACE=${process.env.TARGET_ENVIRONMENT} && gen3 kube-setup-secrets && gen3 job run etl`);
  console.log(`result: ${cmd1}`);
}

runFrigginETL();

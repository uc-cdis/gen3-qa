const { Bash } = require('../utils/bash');

const bash = new Bash();

async function runGen3Roll(serviceName) {
  process.env['KUBECTL_NAMESPACE'] = process.env.TARGET_ENVIRONMENT;
  process.env['GEN3_HOME'] = `${require('path').resolve(__dirname, '..')}/cloud-automation`;
  const cmd1 = await  bash.runCommand(`gen3 kube-setup-secrets && gen3 roll ${serviceName}`);
  console.log(`result: ${cmd1}`);
}

runGen3Roll(process.env.SERVICE_NAME);

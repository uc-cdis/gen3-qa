const { Bash } = require('../utils/bash');
const bash = new Bash();

async function runFrigginETL() {
  const cmd1 = await bash.runCommand('gen3 kube-setup-secrets');
  console.log(`result: ${cmd1}`);
  const cmd2 = await bash.runCommand('gen3 job run etl');
  console.log(`result: ${cmd2}`);
  const cmd3 = await bash.runCommand('gen3 roll guppy');
  console.log(`result: ${cmd3}`);
}

runFrigginETL();

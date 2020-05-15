const { Bash } = require('../utils/bash');
const inJenkins = (process.env.JENKINS_HOME !== '' && process.env.JENKINS_HOME !== undefined);
const bash = new Bash();

async function runFrigginETL() {
  const result = await bash.runCommand('gen3 job run etl');
  console.log(`result: ${result}`);
}

runFrigginETL()

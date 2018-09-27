const fs = require('fs');
const readline = require('readline');

const { getFiles } = require('./service_templates.js');

// This script generates files needed for a new service

function createService(serviceName, typeDir, allFiles) {
  // Verify directory exists, and this service directory does NOT exist
  const serviceDir = `${typeDir}/${serviceName}`;

  if (!fs.existsSync(typeDir)) {
    throw new Error(
      `Unable to find ${typeDir}, make sure you are running the command from the root directory of the project.`,
    );
  } else if (fs.existsSync(serviceDir)) {
    throw new Error(
      `Service already exists at ${serviceDir}. Unable to generate files.`,
    );
  } else {
    fs.mkdirSync(serviceDir);
  }

  // Write files
  Object.values(allFiles).forEach((thisFile) => {
    fs.writeFile(`${serviceDir}/${thisFile.name}`, thisFile.template, (err) => {
      if (err) {
        console.log(err);
        throw new Error('Failed to create service. See above.');
      }
    });
  });

  console.log(`Created template files for ${serviceName} at ${serviceDir}`);
  console.log(
    "Add your service to the codecept.conf.js file in 'include' to use it.",
  );
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(
  'Select an option:\nCreate an API service [1] or Portal service [2]: ',
  (answer) => {
    rl.question('Type in the service name: ', (serviceName) => {
      const allFiles = getFiles(serviceName);
      const serviceTypeDir = answer === '1' ? './services/apis' : './services/portal';
      createService(serviceName, serviceTypeDir, allFiles);

      rl.close();
    });
  },
);


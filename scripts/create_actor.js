const fs = require('fs');
const readline = require('readline');

const { getFiles } = require('./actor_templates.js');

// This script generates files needed for a new actor

function createActor(actorName, typeDir, allFiles) {
  // Verify directory exists, and this actor directory does NOT exist
  const actorDir = `${typeDir}/${actorName}`;

  if (!fs.existsSync(typeDir)) {
    throw new Error(
      `Unable to find ${typeDir}, make sure you are running the command from the root directory of the project.`,
    );
  } else if (fs.existsSync(actorDir)) {
    throw new Error(
      `Actor already exists at ${actorDir}. Unable to generate files.`,
    );
  } else {
    fs.mkdirSync(actorDir);
  }

  // Write files
  Object.values(allFiles).forEach((thisFile) => {
    fs.writeFile(`${actorDir}/${thisFile.name}`, thisFile.template, (err) => {
      if (err) {
        console.log(err);
        throw new Error('Failed to create actor. See above.');
      }
    });
  });

  console.log(`Created template files for ${actorName} at ${actorDir}`);
  console.log(
    "Add your actor to the codecept.conf.js file in 'include' to use it.",
  );
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(
  'Select an option:\nCreate an API actor [1] or Portal actor [2]: ',
  (answer) => {
    rl.question('Type in the actor name: ', (actorName) => {
      const allFiles = getFiles(actorName);
      const actorTypeDir = answer === 1 ? './actors/apis' : './actors/portal';
      createActor(actorName, actorTypeDir, allFiles);

      rl.close();
    });
  },
);


const fs = require('fs');
const readline = require('readline');

const { getFiles } = require('./actor_templates.js');

// This script generates files needed for a new actor

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(
  'Select an option:\nCreate an API actor [1] or Portal actor [2]: ',
  answer => {
    rl.question('Type in the actor name: ', actor_name => {
      const all_files = getFiles(actor_name);
      const actor_type_dir = answer === 1 ? './actors/apis' : './actors/portal';
      createActor(actor_name, actor_type_dir, all_files);

      rl.close();
    });
  },
);

function createActor(actor_name, type_dir, all_files) {
  // Verify directory exists, and this actor directory does NOT exist
  const actor_dir = `${type_dir}/${actor_name}`;

  if (!fs.existsSync(type_dir)) {
    throw new Error(
      `Unable to find ${type_dir}, make sure you are running the command from the root directory of the project.`,
    );
  } else if (fs.existsSync(actor_dir)) {
    throw new Error(
      `Actor already exists at ${actor_dir}. Unable to generate files.`,
    );
  } else {
    fs.mkdirSync(actor_dir);
  }

  // Write files
  Object.values(all_files).forEach(this_file => {
    fs.writeFile(`${actor_dir}/${this_file.name}`, this_file.template, err => {
      if (err) {
        console.log(err);
        throw new Error('Failed to create actor. See above.');
      }
    });
  });

  console.log(`Created template files for ${actor_name} at ${actor_dir}`);
  console.log(
    "Add your actor to the codecept.conf.js file in 'include' to use it.",
  );
}

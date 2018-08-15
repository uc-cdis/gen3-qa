'use strict';
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// This script generates files needed for a new actor

rl.question('API actor name: ', (answer) => {
  console.log("Creating actor...");
  createApiTemplate(answer);
  rl.close();
});

function createApiTemplate(actor_name) {
  let tasks = `${actor_name}_tasks`;
  let questions = `${actor_name}_questions`;
  let props = `${actor_name}_props`;
  let sequences = `${actor_name}_sequences`;

  let actor_script = `'use strict';
  
const ${tasks} = require('./${tasks}.js');
const ${questions} = require('./${questions}.js');
const ${props} = require('./${props}.js');

/**
 * ${actor_name} Actor
 */
module.exports = {
  props: ${props},

  do: ${tasks},

  ask: ${questions}
};
  `;

  let tasks_script = `'use strict';
  
const ${props} = require('./${props}.js');
let I = actor();

/**
 * ${actor_name} Tasks
 */
module.exports = {

};
`;

  let questions_script = `'use strict';
  
let chai = require('chai');
let expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

const ${props} = require('./${props}.js');

/**
 * ${actor_name} Questions
 */
module.exports = {

};

`;

  let props_script = `'use strict';

let util = require('../../../steps/utilSteps');

/**
 * ${actor_name} Properties
 */
module.exports = {
  // EXAMPLE: 
  // endpoints: {
  //   root: 'ROOT_GOES_HERE',
  // }
  //
  // resSuccess: {
  //   code: 200,
  //   success: true,
  //   entity_error_count: 0,
  //   transactional_error_count: 0
  // },
  //
  // resFail: {
  //   code: 400,
  //   success: false
  // }
};
`;

  let sequences_script = `'use strict';

const ${questions} = require('./${questions}.js');
const ${tasks} = require('./${tasks}.js');

/**
 * ${actor_name} sequences
 */
module.exports = {

};
`;

  let all_files = {
    actor_file: {
      script: actor_script,
      name: `${actor_name}_actor.js`
    },
    tasks_file: {
      script: tasks_script,
      name: `${tasks}.js`
    },
    questions_file: {
      script: questions_script,
      name: `${questions}.js`
    },
    props_file: {
      script: props_script,
      name: `${props}.js`
    },
    sequences_file: {
      script: sequences_script,
      name: `${sequences}.js`
    }
  };

  // Verify apis directory exists, and this actor directory does NOT exist
  let apis_dir = `./actors/apis`;
  let actor_dir = `${apis_dir}/${actor_name}`;

  if (!fs.existsSync(apis_dir)) {
    throw new Error('Unable to find ./actors/apis, make sure you are running the command from the root directory of the project.')
  } else if (fs.existsSync(actor_dir)) {
    throw new Error(`Actor already exists at ${actor_dir}. Unable to generate files.`)
  } else {
    fs.mkdirSync(actor_dir);
  }

  // Write files
  Object.values(all_files).forEach(this_file => {
    fs.writeFile(`${actor_dir}/${this_file.name}`, this_file.script, function (err) {
      if (err) {
        console.log(err);
        throw new Error("Failed to create actor. See above.")
      }
    });
  });

  console.log(`Created template files for ${actor_name} at ${actor_dir}`);
  console.log('Add your actor to the codecept.conf.js file in \'include\' to use it.')
}
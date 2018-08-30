module.exports.getFiles = function(actor_name) {
  const tasks = `${actor_name}_tasks`;
  const questions = `${actor_name}_questions`;
  const props = `${actor_name}_props`;
  const sequences = `${actor_name}_sequences`;

  const actor_template = `'use strict';
  
const ${tasks} = require('./${tasks}.js');
const ${questions} = require('./${questions}.js');
const ${props} = require('./${props}.js');
const ${sequences} = require('./${sequences}.js');

/**
 * ${actor_name} Actor
 */
module.exports = {
  props: ${props},

  do: ${tasks},

  ask: ${questions},
  
  complete: ${sequences}
};
`;

  const tasks_template = `'use strict';
  
const ${props} = require('./${props}.js');
let I = actor();

/**
 * ${actor_name} Tasks
 */
module.exports = {
  // API Example:
  // getFiles() {
  //   I.sendGetRequest(sheepdog.endpoints.getFile, commonsHelper.validAccessTokenHeader)
  // }
  //
  // Portal Example:
  // goTo() {
  //   homepage_actor.do.goTo();
  //   portal_helper.clickProp(navbar.props.dictionary_link)
  //   portal_helper.seeProp(dictionary_props.ready_cue)
  // }
};
`;

  const questions_template = `'use strict';
  
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

  const props_template = `'use strict';

/**
 * ${actor_name} Properties
 */
module.exports = {
  // API Example: 
  // endpoints: {
  //   root: 'API_ROOT',
  // },
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
  
  // Portal Page Example:
  // path: '/explorer',
  //
  // ready_cue: {
  //   locator: {
  //     css: '.this-element-appears-when-page-loaded'
  //   }
  // },
  //
  // filterTab: {
  //   context: '.some-container',
  //   locator: {
  //     css: '.my-tab-class'
  //   }
  // }
};
`;

  const sequences_template = `'use strict';

const ${questions} = require('./${questions}.js');
const ${tasks} = require('./${tasks}.js');

/**
 * ${actor_name} sequences
 */
module.exports = {
  // Sequences are for an actor to combine multiple tasks and questions
};
`;

  return {
    actor_file: {
      template: actor_template,
      name: `${actor_name}_actor.js`,
    },
    tasks_file: {
      template: tasks_template,
      name: `${tasks}.js`,
    },
    questions_file: {
      template: questions_template,
      name: `${questions}.js`,
    },
    props_file: {
      template: props_template,
      name: `${props}.js`,
    },
    sequences_file: {
      template: sequences_template,
      name: `${sequences}.js`,
    },
  };
};

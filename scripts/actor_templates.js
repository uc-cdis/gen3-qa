module.exports.getFiles = function (actorName) {
  const tasks = `${actorName}_tasks`;
  const questions = `${actorName}_questions`;
  const props = `${actorName}_props`;
  const sequences = `${actorName}_sequences`;

  const actorTemplate = `'use strict';
  
const ${tasks} = require('./${tasks}.js');
const ${questions} = require('./${questions}.js');
const ${props} = require('./${props}.js');
const ${sequences} = require('./${sequences}.js');

/**
 * ${actorName} Actor
 */
module.exports = {
  props: ${props},

  do: ${tasks},

  ask: ${questions},
  
  complete: ${sequences}
};
`;

  const tasksTemplate = `'use strict';
  
const ${props} = require('./${props}.js');
let I = actor();

/**
 * ${actorName} Tasks
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
  //   portalHelper.clickProp(navbar.props.dictionary_link)
  //   portalHelper.seeProp(dictionary_props.ready_cue)
  // }
};
`;

  const questionsTemplate = `'use strict';
  
let chai = require('chai');
let expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

const ${props} = require('./${props}.js');

/**
 * ${actorName} Questions
 */
module.exports = {

};

`;

  const propsTemplate = `'use strict';

/**
 * ${actorName} Properties
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

  const sequencesTemplate = `'use strict';

const ${questions} = require('./${questions}.js');
const ${tasks} = require('./${tasks}.js');

/**
 * ${actorName} sequences
 */
module.exports = {
  // Sequences are for an actor to combine multiple tasks and questions
};
`;

  return {
    actor_file: {
      template: actorTemplate,
      name: `${actorName}_actor.js`,
    },
    tasks_file: {
      template: tasksTemplate,
      name: `${tasks}.js`,
    },
    questions_file: {
      template: questionsTemplate,
      name: `${questions}.js`,
    },
    props_file: {
      template: propsTemplate,
      name: `${props}.js`,
    },
    sequences_file: {
      template: sequencesTemplate,
      name: `${sequences}.js`,
    },
  };
};

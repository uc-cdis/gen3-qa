module.exports.getFiles = function (serviceName) {
  const tasks = `${serviceName}Tasks`;
  const questions = `${serviceName}Questions`;
  const props = `${serviceName}Props`;
  const sequences = `${serviceName}Sequences`;

  const serviceTemplate = `const ${tasks} = require('./${tasks}.js');
const ${questions} = require('./${questions}.js');
const ${props} = require('./${props}.js');
const ${sequences} = require('./${sequences}.js');

/**
 * ${serviceName} Service
 */
module.exports = {
  props: ${props},

  do: ${tasks},

  ask: ${questions},

  complete: ${sequences},
};
`;

  const tasksTemplate = `// const ${props} = require('./${props}.js');
// let I = actor();

/**
 * ${serviceName} Tasks
 */
module.exports = {
  // API Example:
  // getFiles() {
  //   I.sendGetRequest(sheepdog.endpoints.getFile, accessTokenHeaders)
  // }
  //
  // Portal Example:
  // goTo() {
  //   homepage_service.do.goTo();
  //   portalUtil.clickProp(navbar.props.dictionary_link)
  //   portalUtil.seeProp(dictionaryProps.ready_cue)
  // }
};
`;

  const questionsTemplate = `// let chai = require('chai');
// let expect = chai.expect;
// chai.config.includeStack = true;
// chai.config.truncateThreshold = 0;

// const ${props} = require('./${props}.js');

/**
 * ${serviceName} Questions
 */
module.exports = {

};

`;

  const propsTemplate = `/**
 * ${serviceName} Properties
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
  //
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

  const sequencesTemplate = `// const ${questions} = require('./${questions}.js');
// const ${tasks} = require('./${tasks}.js');

/**
 * ${serviceName} sequences
 */
module.exports = {
  // Sequences are for an service to combine multiple tasks and questions
};
`;

  return {
    service_file: {
      template: serviceTemplate,
      name: `${serviceName}Service.js`,
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

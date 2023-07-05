const studyRegistrationTasks = require('./studyRegistrationTasks.js');
const studyRegistrationProps = require('./studyRegistrationProps.js');

/**
 * studyRegistration Service
 */
module.exports = {
    props: studyRegistrationProps,

    do: studyRegistrationTasks,    
};
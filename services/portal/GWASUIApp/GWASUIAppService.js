const GWASUIAppTasks = require('./GWASUIAppTasks.js');
const GWASUIAppProps = require('./GWASUIAppProps.js');

/**
 * GWASUIApp Service
 */
module.exports = {
    props: GWASUIAppProps,

    do: GWASUIAppTasks,    
};

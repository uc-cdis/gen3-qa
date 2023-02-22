const GWASUIAppTasks = require('./GWASUIAppTasks.js');
const GWASUIAppProps = require('./GWASUIAppProps.js');

/**
 * GWAS++ Service
 */
module.exports = {
    props: GWASUIAppProps,

    do: GWASUIAppTasks,    
};

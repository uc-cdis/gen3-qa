const GWASTasks = require('./GWASTasks.js');
const GWASProps = require('./GWASProps.js');

/**
 * GWASUIApp Service
 */
module.exports = {
    props: GWASProps,

    do: GWASTasks,    
};

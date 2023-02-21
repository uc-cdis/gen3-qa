const GWASppTasks = require('./GWASppTasks.js');
const GWASppProps = require('./GWASppProps.js');

/**
 * fence Service
 */
module.exports = {
    props: GWASppProps,

    do: GWASppTasks,    
};
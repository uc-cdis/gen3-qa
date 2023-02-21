const GWASppTasks = require('../GWASpp/GWASppTasks.js');
const GWASppProps = require('../GWASpp/GWASppProps.js');

/**
 * fence Service
 */
module.exports = {
    props: GWASppProps,

    do: GWASppTasks,    
};
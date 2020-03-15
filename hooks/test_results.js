const { event } = require('codeceptjs');

module.exports = function () {
  event.dispatcher.on(event.test.finished, (test) => {
    console.log('********');
    console.log(`TEST: ${test.title}`);
    console.log(`RESULT: ${test.state}`);
    console.log(`RETRIES: ${test.retryNum}`);
    console.log('********');
  });
};

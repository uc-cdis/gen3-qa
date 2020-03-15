const event = require('codeceptjs').event;

module.exports = function() {

  event.dispatcher.on(event.test.finished, function (test) {
    console.log('********')
    console.log('TEST: ' + test.title);
    console.log('RESULT: ' + test.state);
    console.log('RETRIES: ' + test.retryNum);
    console.log('********');
  });
}
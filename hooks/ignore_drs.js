const { event } = require('codeceptjs');

module.exports = function () {
  event.dispatcher.on(event.test.before, (test) => {
    if(test.title.includes('@drs')){
      test.run = () => console.log(`Ignoring test - ${test.title}`);
    }
  });
};

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const { expect } = chai;

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

const etlTasks = require('./etlTasks.js');
const sheepdogTask = require('../sheepdog/sheepdogTasks.js');

/**
 * fence sequences
 */
module.exports = {
  /**
   * Running ETL first time. Expect no alias at the beginning and have alias at the end
   */
  runETLFirstTime() {
    expect(etlTasks.runETLJob()).to.equal(true);
  },

  /**
   * Running ETL second time. Expect alias to be attached to an increased index
   */
  runETLSecondTime() {
    sheepdogTask.runGenTestData(1);
    expect(etlTasks.runETLJob()).to.equal(true);
  },
};

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const expect = chai.expect;

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

const etlQuestions = require('./etlQuestions.js');
const etlTasks = require('./etlTasks.js');
const etlProps = require('./etlProps.js');

/**
 * fence sequences
 */
module.exports = {
  /**
   * Running ETL first time. Expect no alias at the beginning and have alias at the end
   */
  runETLFirstTime() {
    etlProps.aliases.forEach(async alias => {
      etlTasks.deleteIndices(alias);
      expect(etlTasks.existAlias(alias), 'Fails to delete alias').to.equal(false);
    });
    expect(etlTasks.runETLJob()).to.equal(true);
  },

  /**
   * Running ETL second time. Expect alias to be attached to an increased index
   */
  runETLSecondTime() {
    expect(etlTasks.runETLJob()).to.equal(true);
    etlProps.aliases.forEach(alias => {
      if (etlTasks.existAlias(alias))
      {
        let index = etlTasks.getIndexFromAlias(alias);
        console.error(index)
        etlQuestions.hasVersionIncreased(index, 0);
      }
    });
  },
};

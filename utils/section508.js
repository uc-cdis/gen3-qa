const wcag = require('wcag');

console.log(`Running check against ${process.env.TARGET_GEN3_ENVIRONMENT}...`);
console.log(`Checking first few chars of the AChecker ID: ${process.env.CTDS_QA_ACHECKER.substring(0, 3)}`);

const options = {
  id: `${process.env.CTDS_QA_ACHECKER}`,
  uri: `https://${process.env.TARGET_GEN3_ENVIRONMENT}`,
  guide: '508',
};

wcag(options, (error, data) => {
  if (error) {
    console.error(error);
  } else {
    console.log(data);
  }
});

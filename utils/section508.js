var wcag = require('wcag');

console.log(`Running check against ${process.env.TARGET_GEN3_ENVIRONMENT}...`);
console.log(`Checking first few chars of the AChecker ID: ${process.env.CTDS_QA_ACHECKER.substring(0,3)}`);

var options = {
  id: `${process.env.CTDS_QA_ACHECKER}`,
  uri: `https://${process.env.TARGET_GEN3_ENVIRONMENT}`,
  guide: process.env.GUIDE
};

wcag(options, function (error, data) {
  if (error) {
    console.error(error);
  } else {
    console.log(data);
  }
});

var wcag = require('wcag');
var options = {
  id: `${process.env.CTDS_QA_ACHECKER}`,
  uri: `https://${process.env.GEN3_TARGET_ENVIRONMENT}`,
  guide: '508'
};

wcag(options, function (error, data) {
  if (error) {
    console.error(error);
  } else {
    console.log(data);
  }
});

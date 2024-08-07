const fs = require('fs');
const dummyjson = require('dummy-json'); //

const template = fs.readFileSync('load-testing/metadata-service/templates/template-simple.hbs', { encoding: 'utf8' });

const guidTypes = ['indexed_file_object', 'metadata_object'];
const genders = ['Male', 'Female'];

const myMockdata = {
  guid_type: guidTypes[Math.floor(Math.random() * guidTypes.length)],
  gender: genders[Math.floor(Math.random() * genders.length)],
};

const result = dummyjson.parse(template, { mockdata: myMockdata });
if (process.env.DEBUG === 'true') {
  console.log(`result: ${result}`);
}

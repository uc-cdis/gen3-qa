var fs = require('fs');
var dummyjson = require('dummy-json');

var template = fs.readFileSync('metadata-service/dummy-jsons/template-simple.hbs', {encoding: 'utf8'});

guid_types = ['indexed_file_object', 'metadata_object']
genders = ['Male', 'Female']

var myMockdata = {
  guid_type: guid_types[Math.floor(Math.random() * guid_types.length)],
  gender: genders[Math.floor(Math.random() * genders.length)]
}

var result = dummyjson.parse(template, {mockdata: myMockdata});

console.log(`result: ${result}`);

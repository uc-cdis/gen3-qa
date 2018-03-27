Feature('FenceAPI');

const files = [
  {
    filename: 'testdata1',
    link: 's3://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb9020eef0beed440ad0',
    metadata: {'acls':'test'},
    size: 9,
  }
];

let username = process.env.INDEX_USERNAME;
let password = process.env.INDEX_PASSWORD;

Scenario('test presigned-url', async(I) => {
  files.forEach(
    (file) => {
      return I.seeFileContentEqual(file.did,
        'Hi Zac!\ncdis-data-client uploaded this!\n');
    }
  )
});

BeforeSuite((I) => {
  let uuid = require('uuid');
  let auth= Buffer.from(`${username}:${password}`).toString('base64');
  let headers={
    'Accept': 'application/json',
    'Content-Type': 'application/json; charset=UTF-8',
    'Authorization': `Basic ${auth}`
  };
  files.forEach(
    (file) => {
      file.did = uuid.v4().toString();
      let data = {'file_name': file.filename,
        'did': file.did,
        'form': 'object',
        'size': file.size,
        'urls': [file.link],
        'hashes': {'md5': file.md5},
        'metadata': file.metadata};
      I.sendPostRequest(`/index/index/`, data, headers
      ).then(
        (res) => {
          file.rev = res.body.rev;
        }
      );
    }
  )

});

AfterSuite((I) => {
  let auth= Buffer.from(`${username}:${password}`).toString('base64');
  let headers = {
    'Accept': 'application/json',
    'Authorization': `Basic ${auth}`
  };
  files.forEach(
    (file) => {
      I.sendDeleteRequest(`/index/index/${file.did}?rev=${file.rev}`,
        headers
      ).then(
        (res) => {
          console.log(res.body)
        }
      )
    }
  );
});

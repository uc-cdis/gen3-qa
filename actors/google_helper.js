const { google } = require('googleapis');
const nconf = require('nconf');

nconf
  .argv()
  .env()
  .file('./fence_creds.json');

// Create JWT auth object
const jwt = new google.auth.JWT(
  nconf.get('client_email'),
  null,
  nconf.get('private_key'),
  [
    'https://www.googleapis.com/auth/admin.directory.group',
    'https://www.googleapis.com/auth/admin.directory.group.readonly',
    'https://www.googleapis.com/auth/admin.directory.group.member',
    'https://www.googleapis.com/auth/admin.directory.group.member.readonly',
    'https://www.googleapis.com/auth/admin.directory.user.security',
  ],
  'group-admin@planx-pla.net',
);

// Authorize
jwt.authorize((err, data) => {
  if (err) {
    throw err;
  }
  console.log('You have been successfully authenticated: ', data);
  console.log('My jwt: ', jwt);

  // Get Google Admin API
  const admin = google.admin('directory_v1');

  // List members
  admin.members.list(
    {
      groupKey: 'dcf-integration-qa_read_gbag@planx-pla.net',
      auth: jwt,
    },
    (err, data) => {
      // console.log(data.data.error.errors)
      // console.log(err || data);
      console.log('Members: ', data.data);
    },
  );
});

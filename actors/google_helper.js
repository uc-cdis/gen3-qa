const { google } = require('googleapis');

// Create JWT auth object
const jwt = new google.auth.JWT(
  process.env.GOOGLE_APP_EMAIL,
  null,
  process.env.GOOGLE_APP_PRIVATE_KEY,
  [
    'https://www.googleapis.com/auth/admin.directory.group',
    'https://www.googleapis.com/auth/admin.directory.group.readonly',
    'https://www.googleapis.com/auth/admin.directory.group.member',
    'https://www.googleapis.com/auth/admin.directory.group.member.readonly',
    'https://www.googleapis.com/auth/admin.directory.user.security',
  ],
  'group-admin@planx-pla.net',
);

module.exports = {
  async getProjectMembers() {
    jwt.authorize((err, data) => {
      if (err) {
        throw err;
      }
      console.log('You have been successfully authenticated: ', data);
      console.log('My jwt: ', jwt);

      // Get Google Admin API
      const admin = google.admin('directory_v1');

      // List members
      return admin.members.list(
        {
          groupKey: 'dcf-integration-qa_read_gbag@planx-pla.net',
          auth: jwt,
        },
        (err2, data2) => {
          // console.log(data.data.error.errors)
          // console.log(err || data);
          console.log('Members: ', data2.data);
          return data2.data;
        },
      );
    });
  },
};

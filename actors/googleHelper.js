const { google } = require('googleapis');

const fenceApp = {
  scopes: [
    'https://www.googleapis.com/auth/admin.directory.group',
    'https://www.googleapis.com/auth/admin.directory.group.readonly',
    'https://www.googleapis.com/auth/admin.directory.group.member',
    'https://www.googleapis.com/auth/admin.directory.group.member.readonly',
    'https://www.googleapis.com/auth/admin.directory.user.security',
  ],

  asUser: 'group-admin@planx-pla.net',

  get creds() {
    // written as a 'get' b/c env vars will not be set when module is loaded
    return JSON.parse(process.env.GOOGLE_APP_CREDS_JSON);
  },

  jwt: null,

  init() {
    // set the jwt
    this.jwt = new google.auth.JWT(
      this.creds.client_email,
      null,
      this.creds.private_key,
      this.scopes,
      this.asUser,
    );
  },
};

async function auth(jwt, callback, args) {
  // TODO: will there be multiple types of accounts to log in as?
  // if so, need to add jwt as an arg, create a file for storing jwt's
  return new Promise((resolve) => {
    jwt.authorize((err) => {
      if (err) {
        console.log(err);
        resolve({ error: err });
      } else {
        resolve(callback(jwt, args));
      }
    });
  });
}

async function getProjectMembers(jwt, project) {
  // Get Google Admin API
  const admin = google.admin('directory_v1');
  console.log('TODO: implement using project', project);

  // List members in the project
  return new Promise((resolve) => {
    admin.members.list(
      {
        groupKey: 'dcf-integration-qa_read_gbag@planx-pla.net',
        auth: jwt,
      },
      (err, data) => {
        if (err) {
          resolve({ error: err.errors });
        } else {
          resolve(data.data.members);
        }
      },
    );
  });
}

module.exports = {
  async getProjectMembers(project) {
    if (!fenceApp.jwt) {
      fenceApp.init();
      return auth(fenceApp.jwt, getProjectMembers, project);
    }
    return getProjectMembers(fenceApp.jwt, project);
  },
};

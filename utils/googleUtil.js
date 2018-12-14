/**
 * A module providing util functions using Google's Admin API
 * @module googleUtil
 */

const { google } = require('googleapis');
const {Storage} = require('@google-cloud/storage');


/**
 * Internal object for managing google requests
 */
const googleApp = {
  cloudManagerConfig: {
    scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/iam'],
  },

  adminConfig: {
    scopes: [
      'https://www.googleapis.com/auth/admin.directory.group',
      'https://www.googleapis.com/auth/admin.directory.group.readonly',
      'https://www.googleapis.com/auth/admin.directory.group.member',
      'https://www.googleapis.com/auth/admin.directory.group.member.readonly',
      'https://www.googleapis.com/auth/admin.directory.user.security',
    ],
    subject: 'group-admin@planx-pla.net',
  },

  get creds() {
    // written as a 'get' b/c env vars will not be set when module is loaded
    try {
      return JSON.parse(process.env.GOOGLE_APP_CREDS_JSON);
    } catch (err) {
      console.error(`ERROR: google creds not valid in GOOGLE_APP_CREDS_JSON env variable: ${process.env.GOOGLE_APP_CREDS_JSON}`, err);
      throw new Error('Invalid Google Creds');
    }
  },

  authorize({ scopes, subject }, callback) {
    const jwt = new google.auth.JWT(
      this.creds.client_email,
      null,
      this.creds.private_key,
      scopes,
      subject,
    );

    return callback(jwt);
  },

  getIAMPolicy(projectID, authClient) {
    return new Promise((resolve) => {
      const cloudResourceManager = google.cloudresourcemanager('v1');
      const request = {
        resource_: projectID,
        auth: authClient,
      };

      cloudResourceManager.projects.getIamPolicy(request, (err, response) => {
        if (err) {
          console.error(err);
          throw Error(err);
        }
        resolve(response.data);
      });
    });
  },

  setIAMPolicy(projectID, iamPolicy, authClient) {
    return new Promise((resolve) => {
      const cloudResourceManager = google.cloudresourcemanager('v1');
      const request = {
        resource_: projectID,
        resource: {
          policy: iamPolicy,
        },
        auth: authClient,
      };
      cloudResourceManager.projects.setIamPolicy(request, (err, res) => {
        if (err) {
          throw Error(err);
        }
        resolve(res.data);
      });
    });
  },
};

/**
 * Exported google util functions
 */
module.exports = {
  async getFileFromBucket(googleProject, pathToCredsKeyFile, bucketName, fileName) {
    return new Promise((resolve) => {
      // returns a https://cloud.google.com/nodejs/docs/reference/storage/2.0.x/File
      // see https://cloud.google.com/docs/authentication/production for info about
      // passing creds
      const storage = new Storage({
        projectId: googleProject,
        keyFilename: pathToCredsKeyFile,
        bucketName: bucketName
      });

      const file = storage.bucket(bucketName).file(fileName);

      file.get(function(err, file, apiResponse) {
        // file.metadata` has been populated.
        if (err) {
          if(err instanceof Error) {
            resolve(err.response)
          }
          resolve(Error(err));
        }
        resolve(file);
      });
    });
  },

  async getGroupMembers(groupKey) {
    return googleApp.authorize(googleApp.adminConfig, (authClient) => {
      // Get Google Admin API
      const admin = google.admin('directory_v1');
      admin.members.list(
        {
          groupKey,
          auth: authClient,
        },
        (err, data) => {
          if (err) {
            return { error: err.errors };
          }
          return data.data.members;
        },
      );
    });
  },

  async updateUserRole(projectID, { role, members }) {
    return googleApp.authorize(googleApp.cloudManagerConfig, authClient =>
      googleApp.getIAMPolicy(projectID, authClient)
        .then((iamPolicy) => {
          // update the policy
          iamPolicy.bindings.push({ role, members });

          // submit the updated policy
          return googleApp.setIAMPolicy(projectID, iamPolicy, authClient);
        })
        .catch((err) => {
          console.log(err);
          return err;
        }),
    );
  },

  async removeUserRole(projectID, { role, members }) {
    return googleApp.authorize(googleApp.cloudManagerConfig, authClient =>
      googleApp.getIAMPolicy(projectID, authClient)
        .then((iamPolicy) => {
          // find the binding with same role
          const targetBinding = iamPolicy.bindings.find(binding => binding.role === role);
          if (!targetBinding) {
            return iamPolicy;
          }
          // remove members
          for (const member of members) {
            const memberIdx = targetBinding.members.indexOf(member);
            if (memberIdx > -1) {
              targetBinding.members.splice(memberIdx, 1);
            }
          }

          // submit the updated policy
          return googleApp.setIAMPolicy(projectID, iamPolicy, authClient);
        })
        .catch((err) => {
          console.log(err);
          return err;
        }),
    );
  },

  async removeAllOptionalUsers(projectID) {
    return googleApp.authorize(googleApp.cloudManagerConfig, authClient =>
      googleApp.getIAMPolicy(projectID, authClient)
        .then((iamPolicy) => {
          const requiredRoles = [
            'roles/owner',
            'roles/resourcemanager.projectIamAdmin',
            'roles/editor',
          ];
          const bindings = iamPolicy.bindings;
          iamPolicy.bindings = bindings.filter(binding => requiredRoles.indexOf(binding.role) > -1);
          return googleApp.setIAMPolicy(projectID, iamPolicy, authClient);
        })
        .catch((err) => {
          console.log(err);
          return err;
        }),
    );
  },

  async createServiceAccount(projectID, serviceAccountName) {
    return new Promise((resolve) => {
      return googleApp.authorize(googleApp.cloudManagerConfig, (authClient) => {
        const cloudResourceManager = google.iam('v1');
        const request = {
          resource: {
            accountId: serviceAccountName,
          },
          name: `projects/${projectID}`,
          auth: authClient,
        };
        cloudResourceManager.projects.serviceAccounts.create(request, (err, res) => {
          if (err) {
            if(err instanceof Error) {
              resolve(err)
            } else {
              resolve(Error(err));
            }
          }
          if (res && res.data) {
            resolve(res.data);
          } else {
            resolve(Error(`Unexpected create service account result: ${JSON.stringify(res)}`));
          }
        });
      });
    })
  },

  async deleteServiceAccount(projectID, serviceAccountID) {
    return new Promise((resolve) => {
      return googleApp.authorize(googleApp.cloudManagerConfig, (authClient) => {
        const cloudResourceManager = google.iam('v1');
        const request = {
          name: `projects/-/serviceAccounts/${serviceAccountID}`,
          auth: authClient,
        };
        cloudResourceManager.projects.serviceAccounts.delete(request, (err, res) => {
          if (err) {
            resolve(Error(err));
          }
          resolve(res.data);
        });
      });
    })
  },
};

/**
 * A module providing util functions using Google's Admin API
 * @module googleUtil
 */

const { google } = require('googleapis');

/**
 * Internal object for managing google requests
 */
const googleApp = {
  cloudManagerConfig: {
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
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
    return JSON.parse(process.env.GOOGLE_APP_CREDS_JSON);
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
};

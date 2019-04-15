/**
 * A module providing util functions using Google's Admin API
 * @module googleUtil
 */

const atob = require('atob');
const chai = require('chai');
const expect = chai.expect;
const { google } = require('googleapis');
const { Storage } = require('@google-cloud/storage');

const apiUtil = require('./apiUtil.js');
const files = require('./file.js');


// the lock name is shared by all the testing sessions
const lockServiceAccountName = 'locked-by-test';

// keep track of whether THIS testing session locked the project
let I_LOCKED_A_PROJECT = false;


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
    return new Promise((resolve, reject) => {
      const cloudResourceManager = google.cloudresourcemanager('v1');
      const request = {
        resource_: projectID,
        auth: authClient,
      };

      cloudResourceManager.projects.getIamPolicy(request, (err, response) => {
        if (err) {
          console.error(err);
          reject(err);
          return;
        }
        resolve(response.data);
      });
    });
  },

  setIAMPolicy(projectID, iamPolicy, authClient) {
    return new Promise((resolve, reject) => {
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
          reject(err);
          return;
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

      resolve(
        file.get()
        .then(function(data) {
          // Note: data[0] is the file; data[1] is the API response
          console.log(`Got file ${fileName} from bucket ${bucketName}`);
          return data[0];
        })
        .catch((err) => {
          console.log(`Cannot get file ${fileName} from bucket ${bucketName}`);
          return {
            statusCode: err.code || 403,
            message: err.message
          };
        })
      )
    });
  },

  /**
   * It can take some time for the user to be denied access to data.
   * This function waits and eventually returns false if the user can still
   * access data after the timeout, true otherwise
   */
  async waitForNoDataAccess(googleBucket, pathToKeyFile) {
    /**
     * return true if the user can access data, false otherwise
     */
    const isDataInaccessible = async function() {
      try {
        // Try to access data
        user0AccessQAResAfter = await module.exports.getFileFromBucket(
          googleBucket.googleProjectId,
          pathToKeyFile,
          googleBucket.bucketId,
          googleBucket.fileName
        );
        chai.expect(user0AccessQAResAfter).to.have.property('statusCode', 403);
        return true;
      }
      catch {
        console.log('Data is still accessible: rerunning');
        return false;
      }
    };
    const timeout = 60; // max number of seconds to wait
    let dataAccessIsDenied = true;
    try {
      await apiUtil.smartWait(isDataInaccessible, [], timeout, '');
    }
    catch {
      dataAccessIsDenied = false;
    }
    return dataAccessIsDenied;
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


  /**
   * @param {string} serviceAccount - name or ID of the SA to get
   * @param {string} projectID
   * @returns {object} the service account
   */
  async getServiceAccount(projectID, serviceAccount) {
    return new Promise((resolve) => {
      return googleApp.authorize(googleApp.cloudManagerConfig, (authClient) => {
        const cloudResourceManager = google.iam('v1');
        const request = {
          name: `projects/${projectID}/serviceAccounts/${serviceAccount}`,
          auth: authClient,
        };
        cloudResourceManager.projects.serviceAccounts.get(request, (err, res) => {
          if (err) {
            if (err instanceof Error) {
              resolve(err);
            } else {
              resolve(Error(err));
            }
            return;
          }
          if (res && res.data) {
            resolve(res.data);
          } else {
            resolve(Error(`Unexpected get service account result: ${JSON.stringify(res)}`));
          }
        });
      });
    })
  },

  async createServiceAccount(projectID, serviceAccountName, description='') {
    return new Promise((resolve) => {
      return googleApp.authorize(googleApp.cloudManagerConfig, (authClient) => {
        const cloudResourceManager = google.iam('v1');
        const request = {
          resource: {
            accountId: serviceAccountName,
            serviceAccount: {
              // the API does not allow description input, so use name
              displayName: description
            },
          },
          name: `projects/${projectID}`,
          auth: authClient,
        };
        cloudResourceManager.projects.serviceAccounts.create(request, (err, res) => {
          if (err) {
            if (err instanceof Error) {
              resolve(err);
            } else {
              resolve(Error(err));
            }
            return;
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

  async deleteServiceAccount(serviceAccountID, projectID=null) {
    if (!projectID) {
      projectID = '-'; // auto get project ID from SA ID
    }
    return new Promise((resolve) => {
      return googleApp.authorize(googleApp.cloudManagerConfig, (authClient) => {
        const cloudResourceManager = google.iam('v1');
        const request = {
          name: `projects/${projectID}/serviceAccounts/${serviceAccountID}`,
          auth: authClient,
        };
        cloudResourceManager.projects.serviceAccounts.delete(request, (err, res) => {
          if (err) {
            resolve(Error(err));
            return;
          }
          resolve(res.data);
        });
      });
    })
  },

  async createServiceAccountKey(projectID, serviceAccountName) {
    return new Promise((resolve) => {
      return googleApp.authorize(googleApp.cloudManagerConfig, (authClient) => {
        const cloudResourceManager = google.iam('v1');
        const request = {
          name: `projects/${projectID}/serviceAccounts/${serviceAccountName}`,
          auth: authClient,
        };
        cloudResourceManager.projects.serviceAccounts.keys.create(request, (err, res) => {
          if (err) {
            console.log(err);
            if (err instanceof Error) {
              resolve(Error(err.code));
            } else {
              resolve(Error(err));
            }
            return;
          }
          if (res && res.data) {
            resolve(res.data);
          } else {
            resolve(Error(`Unexpected create service account key result: ${JSON.stringify(res)}`));
          }
        });
      });
    })
  },

  /**
   * Util function that returns the path to the file where the requested key
   * was saved and the name of that key
   */
  async createServiceAccountKeyFile(googleProject) {
    var tempCredsRes = await this.createServiceAccountKey(googleProject.id, googleProject.serviceAccountEmail);
    keyFullName = tempCredsRes.name;
    console.log(`Created key ${keyFullName}`);
    var keyData = JSON.parse(atob(tempCredsRes.privateKeyData));
    var pathToKeyFile = keyData.private_key_id + '.json';
    await files.createTmpFile(pathToKeyFile, JSON.stringify(keyData));
    console.log(`Google creds file ${pathToKeyFile} saved!`);
    return [pathToKeyFile, keyFullName];
  },

  async deleteServiceAccountKey(keyName) {
    return new Promise((resolve) => {
      return googleApp.authorize(googleApp.cloudManagerConfig, (authClient) => {
        const cloudResourceManager = google.iam('v1');
        const request = {
          name: keyName, // "projects/X/serviceAccounts/Y/keys/Z"
          auth: authClient,
        };
        cloudResourceManager.projects.serviceAccounts.keys.delete(request, (err, res) => {
          if (err) {
            resolve(Error(err));
            return;
          }
          resolve(res.data);
        });
      });
    })
  },

  lockServiceAccountName,

  getLockingServiceAccountEmail(googleProjectEmail) {
    return `${lockServiceAccountName}@${googleProjectEmail.substring(googleProjectEmail.indexOf('@')+1)}`;
  },

  /**
   * Locks a Google project for exclusive use by a test
   * If the project is already locked, waits for it to become available
   * @param {string} googleProject - project to lock
   * @param {int} timeout - max number of seconds to wait
   * @param {string} simulateOtherSession - if true, will not update I_LOCKED_A_PROJECT. should only be used by the locking test!
   * Returns true if successfully locked, false otherwise
   */
  async lockGoogleProject(googleProject, timeout=180, simulateOtherSession=false) {
    if (googleProject.id != 'gen3qa-validationjobtest') {
      console.log(`We only allow locking the project "googleProjectDynamic" (id "gen3qa-validationjobtest"). You are trying to lock "${googleProject.id}"`);
      return false;
    }

    const serviceAccountEmail = this.getLockingServiceAccountEmail(googleProject.serviceAccountEmail, lockServiceAccountName);

    console.log(`Trying to lock Google project "${googleProject.id}"...`);

    /**
     * return true if the project was successfully locked, false otherwise
     */
    const tryLockProject = async function(googleProject) {
      // check if the project is already locked
      getRes = await module.exports.getServiceAccount(googleProject.id, serviceAccountEmail);
      if (getRes.email == serviceAccountEmail) {
        return false; // the SA exists: the project is locked
      }
      if (getRes.code != 404) {
        // unexpected GET error
        console.log(getRes);
        return false;
      }

      const createRes = await module.exports.createServiceAccount(googleProject.id, lockServiceAccountName, 'Locked: a test is currently using the project');

      if (typeof createRes === 'object' && createRes instanceof Error) {
        console.log('Unable to lock the project even though it is not already locked...');
        console.log(createRes);
        return false;
      } else {
        expect(createRes).to.have.property('email');
        expect(createRes.email).to.equal(serviceAccountEmail);
        console.log('Successfully locked project');
        return true;
      }
    };

    try {
      await apiUtil.smartWait(tryLockProject, [googleProject], timeout, `Could not lock project after ${timeout} secs`);
      if (!simulateOtherSession) {
        I_LOCKED_A_PROJECT = true;
      }
    }
    catch(err) {
      console.log(err);
      return false;
    }

    return true;
  },

  getLockGoogleProjectErrorDetails(googleProject) {
    return `Could not lock Google project "${googleProject.id}" to run tests where we modify the project itself. Locks are necessary to avoid interfering with other testing envs since they all use the same Google Project: "Gen3QA-ValidationJobTest". We attempted to "lock" the project by creating a service account unique to this test run. We either could not create the SA or the project is locked by a *different* test env and we timed out. Ensure that other tests did not fail to remove their lock for some reason by manually deleting the service account "${lockServiceAccountName}" in Google project "${googleProject.id}" (owner "${googleProject.owner}").\n`
  },

  /**
   * Unlocks a Google project
   * @param {string} googleProject - project to lock
   * @param {string} simulateOtherSession - if true, will not update I_LOCKED_A_PROJECT. should only be used by the locking test!
   * Returns true if nothing to unlock or successfully unlocked, false
   * otherwise
   */
  async unlockGoogleProject(googleProject, simulateOtherSession=false) {
    console.log(`Trying to unlock Google project "${googleProject.id}"...`);
    const serviceAccountEmail = this.getLockingServiceAccountEmail(googleProject.serviceAccountEmail);

    // check if the project is locked. if not locked: return success
    getRes = await module.exports.getServiceAccount(googleProject.id, serviceAccountEmail);
    if (getRes.code == 404) {
      console.log('Project is not locked');
      return true;
    }
    if (getRes.email != serviceAccountEmail) {
      // unexpected GET error
      console.log(getRes);
      return false;
    }

    // if it's locked by another testing session: cannot unlock
    // (unless we are simulating the other session unlocking)
    if (!I_LOCKED_A_PROJECT && !simulateOtherSession) {
      console.log('Cannot unlock project (it was locked by another testing session)');
      return false;
    }

    // if it's locked by this testing session: try to unlock
    const deleteRes = await this.deleteServiceAccount(serviceAccountEmail, googleProject.id);

    // if successfully unlocked, res is an empty object
    if (deleteRes.constructor === Object && Object.keys(deleteRes).length === 0) {
      console.log('Successfully unlocked project');
      if (!simulateOtherSession) {
        I_LOCKED_A_PROJECT = false;
      }
      return true;
    }
    else {
      console.log('Cannot unlock project');
      console.log(deleteRes);
      return false;
    }
  },

  getUnlockGoogleProjectErrorDetails(googleProject) {
    return `Failed to unlock Google project "${googleProject.id}" after running tests where we modify the project itself. Locks are necessary to avoid interfering with other testing envs since they all use the same Google Project: "Gen3QA-ValidationJobTest". We "locked" the project by creating a service account unique to this test run. Other tests that use this project will fail because they will not be able to lock it. If this error happens during a test run, the tests will attempt to unlock the project later. If this error happens during steps "After each" or "After all", ensure that the lock specific to this test run has been removed by manually deleting the service account "${lockServiceAccountName}" in Google project "${googleProject.id}" (owner "${googleProject.owner}").\n`
  },
};

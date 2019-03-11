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


const lockServiceAccountName = 'locked-by-test';


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
  /**
   * Cleans up fence's DBs for links and service accounts
   * Takes the google, fence, and users services/utils as params
   * @returns {Promise<void>}
   */
  async suiteCleanup(fence, users) {
    // unlock the lockable google project
    await this.unlockGoogleProject(fence.props.googleProjectDynamic);

    // google projects to 'clean up'
    const googleProjects = [
      fence.props.googleProjectA,
      fence.props.googleProjectDynamic,
      fence.props.googleProjectWithComputeServiceAcct,
    ];
    // remove unimportant roles from google projects
    for (const proj of googleProjects) {
      await this.removeAllOptionalUsers(proj.id);
    }

    // delete all service accounts from fence
    for (const proj of googleProjects) {
      // TRY to delete the service account
      // NOTE: the service account might have been registered unsuccessfully or deleted,
      //  we are just hitting the endpoints as if it still exists and ignoring errors
      const projUser = users.mainAcct;

      if (!projUser.linkedGoogleAccount) {
        // If the project user is not linked, link to project owner then delete
        await fence.do.forceLinkGoogleAcct(projUser, proj.owner)
          .then(() =>
            fence.do.deleteGoogleServiceAccount(projUser, proj.serviceAccountEmail),
          );
      } else if (projUser.linkedGoogleAccount !== proj.owner) {
        // If the project user is linked, but not to project owner,
        // unlink user, then link to project owner and delete service account
        await fence.complete.unlinkGoogleAcct(projUser)
          .then(() =>
            fence.do.forceLinkGoogleAcct(projUser, proj.owner),
          )
          .then(() =>
            fence.do.deleteGoogleServiceAccount(projUser, proj.serviceAccountEmail),
          );
      } else {
        // If project user is linked to the project owner, delete the service account
        await fence.do.deleteGoogleServiceAccount(projUser, proj.serviceAccountEmail);
      }
    }

    // unlink all google accounts
    const unlinkPromises = Object.values(users).map(user => fence.do.unlinkGoogleAcct(user));
    await Promise.all(unlinkPromises);
  },

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

  async listServiceAccounts(projectID) {
    saList = [];
    nextPageToken = '';
    while (typeof nextPageToken !== 'undefined') {
      listRes = await new Promise((resolve) => {
        return googleApp.authorize(googleApp.cloudManagerConfig, (authClient) => {
          const cloudResourceManager = google.iam('v1');
          const request = {
            name: `projects/${projectID}`,
            auth: authClient,
            pageSize: new Number(5), // get the first 5 SAs
            pageToken: nextPageToken,
          };
          cloudResourceManager.projects.serviceAccounts.list(request, (err, res) => {
            if (err) {
              if(err instanceof Error) {
                resolve(err)
              } else {
                resolve(Error(err));
              }
              return;
            }
            if (res && res.data) {
              resolve(res.data);
            } else {
              resolve(Error(`Unexpected list service account result: ${JSON.stringify(res)}`));
            }
          });
        });
      });
      if (listRes.accounts)
        saList = saList.concat(listRes.accounts);
      nextPageToken = listRes.nextPageToken; // is undefined if done
    }
    return saList;
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
            if(err instanceof Error) {
              resolve(err)
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

  // TODO: projectID is not used (- gets project id from SA id), remove param
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
            if(err instanceof Error) {
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
   * TODO: use in data access test
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

  getLockingServiceAccountEmail(googleProjectEmail) {
    return `${lockServiceAccountName}@${googleProjectEmail.substring(googleProjectEmail.indexOf('@')+1)}`;
  },

  /**
   * Locks a Google project for exclusive use by a test
   * If the project is already locked, waits for it to become available
   * @param {string} googleProject - project to lock
   * @param {int} timeout - max number of seconds to wait
   * Returns true if successfully locked, false otherwise
   */
  async lockGoogleProject(googleProject, timeout=180) {
    if (googleProject.id != 'gen3qa-validationjobtest') {
      console.log(`We only allow locking the project "googleProjectDynamic" (id "gen3qa-validationjobtest"). You are trying to lock "${googleProject.id}"`);
      return false;
    }

    const serviceAccountEmail = this.getLockingServiceAccountEmail(googleProject.serviceAccountEmail);

    console.log(`Trying to lock Google project "${googleProject.id}"...`);

    /**
     * return true if the project was successfully locked, false otherwise
     */
    const tryLockProject = async function(googleProject) {
      const createRes = await module.exports.createServiceAccount(googleProject.id, lockServiceAccountName, 'Locked: a test is currently using the project');

      if (typeof createRes === 'object' && createRes instanceof Error) {
        return false;
      } else {
        expect(createRes).to.have.property('email');
        expect(createRes.email).to.equal(serviceAccountEmail);
        console.log('Successully locked project');
        return true;
      }
    };

    try {
      await apiUtil.smartWait(tryLockProject, [googleProject], timeout, `Could not lock project after ${timeout} secs`);
      return true;
    }
    catch(err) {
      console.log(err);
      return false;
    }
  },

  /**
   * Unlocks a Google project
   * Returns true if nothing to unlock or successfully unlocked, false
   * otherwise
   */
  async unlockGoogleProject(googleProject) {
    const serviceAccountEmail = this.getLockingServiceAccountEmail(googleProject.serviceAccountEmail);

    // check if the project is locked
    listRes = await this.listServiceAccounts(googleProject.id);
    isLocked = listRes.some(sa => sa.email === serviceAccountEmail);
    if (!isLocked) return true;

    console.log(`Unlocking Google project "${googleProject.id}"`);
    const deleteRes = await this.deleteServiceAccount(googleProject.id, serviceAccountEmail);
    // if successfully unlocked, res is an empty object
    return (deleteRes.constructor === Object && Object.keys(deleteRes).length === 0);
  },
};

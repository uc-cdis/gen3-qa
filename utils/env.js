/**
 * A module providing utility functions for high level commons info
 * @module env
 */

const ENV_TYPE = { JENKINS: 0, LOCAL_AGAINST_GEN3_K8S: 1, LOCAL_AGAINST_DOCKER: 2, LOCAL_AGAINST_REMOTE: 3 };

function getEnvType(){
  console.error('getEnvType');
  console.error(process.env.NAMESPACE);
  console.error(process.env.RUNNING_LOCAL);
  if (process.env.JENKINS_HOME !== '' && process.env.JENKINS_HOME !== undefined) {
    return ENV_TYPE.JENKINS;
  } else if (process.env.GEN3_COMMONS_HOSTNAME) {
    return ENV_TYPE.LOCAL_AGAINST_REMOTE;
  } else if (process.env.RUNNING_LOCAL === 'true') {
    if (process.env.NAMESPACE !== undefined && process.env.NAMESPACE !== '')
    {
      console.error('Running against k8s cluster.')
      return ENV_TYPE.LOCAL_AGAINST_GEN3_K8S;
    } else {
      return ENV_TYPE.LOCAL_AGAINST_DOCKER;
    }
  }
  return ENV_TYPE.LOCAL_AGAINST_DOCKER;
}

const envVal = getEnvType();

class Env{
  /**
   * Return the current running environment (in-jenkins, local against k8s or local against docker)
   * @returns {number}
   */

  static getSubDomain() {
    let subdomain = process.env.NAMESPACE;
    if (subdomain === '' || subdomain === undefined) {
      throw Error('NAMESPACE environment variable must be set.');
    }
    if (subdomain === 'default') {
      subdomain = 'qa';
    }
    return subdomain;
  }

  /**
   * Setup fundamental environment variables such as HOSTNAME
   */
  static setupEnvVariables() {
    debugger;
    console.error(`Start setup`);
    if (envVal === ENV_TYPE.LOCAL_AGAINST_REMOTE) {
      process.env.HOSTNAME = process.env.GEN3_COMMONS_HOSTNAME;
    } else if (envVal === ENV_TYPE.JENKINS || envVal === ENV_TYPE.LOCAL_AGAINST_GEN3_K8S) {
      process.env.HOSTNAME = process.env.GEN3_COMMONS_HOSTNAME || `${Env.getSubDomain()}.planx-pla.net`;
      console.error(`NAMESPACE: ${process.env.NAMESPACE}`);
    } else {
      process.env.HOSTNAME = `localhost`;
    }
    console.error(`HOSTNAME: ${process.env.HOSTNAME}`);
  }
}

module.exports = {
  Env, ENV_TYPE, envVal
};

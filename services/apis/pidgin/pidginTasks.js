const semver = require('semver');

const pidginProps = require('./pidginProps.js');
const peregrineProps = require('../peregrine/peregrineProps.js');

const I = actor();

/**
 * pidgin Tasks
 */
module.exports = {

  async getCoremetadata(
    file, format = 'application/json', access_token,
  ) {
    const token = {
      Accept: format,
      Authorization: access_token.Authorization,
    };

    // if peregrine is on version 3.2.0/2023.04 or newer, or on a branch, use
    // the peregrine endpoint. if not, use the deprecated pidgin endpoint
    const minSemVer = '3.2.0';
    // We need two dots here to achieve proper comparison later with other monthly versions
    const minMonthlyRelease = semver.coerce('2023.04.0', { loose: true });
    const monthlyReleaseCutoff = semver.coerce('2020', { loose: true });

    const url = await I.sendGetRequest(peregrineProps.endpoints.version)
    .then((response) => {
      var peregrineVersion = response.data.version;
      var url = pidginProps.endpoints.coreMetadataPath;
      if (peregrineVersion) {
        try {
          peregrineVersion = semver.coerce(peregrineVersion, { loose: true });
          if (
            semver.lt(peregrineVersion, minSemVer) ||
            (semver.gte(peregrineVersion, monthlyReleaseCutoff) && semver.lt(peregrineVersion, minMonthlyRelease))
          ) {
            url = pidginProps.endpoints.coreMetadataLegacyPath;
          }
        } catch (error) {} // can't parse or compare the peregrine version: don't use legacy url
      }
      if (process.env.DEBUG === 'true') {
        console.log(`Peregrine version: ${peregrineVersion}; core metadata endpoint: ${url}`);
      }
      return url;
    });

    const endpoint = `${url}/${file.did}`;
    return I.sendGetRequest(endpoint, token).then((res) => res.data);
  },
};

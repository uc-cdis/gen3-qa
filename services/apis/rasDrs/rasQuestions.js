const chai = require('chai');
const { parseJwt } = require('../../../utils/apiUtil.js');

const { expect } = chai;

module.exports = {
  // check if the scope is correct or not
  hasScope(passport) {
    const parsedPassportJwt = parseJwt(passport);
    const ga4ghJWT = parsedPassportJwt.ga4gh_passport_v1[0];
    const ga4ghParseJWT = parseJwt(ga4ghJWT);
    const { scope } = ga4ghParseJWT; // eslint-disable-line no-shadow
    expect(scope).to.equal('openid ga4gh_passport_v1', '###Scope is not correct');
    return true;
  },
};

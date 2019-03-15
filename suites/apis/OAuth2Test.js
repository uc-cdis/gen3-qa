const atob = require('atob');
const chai = require('chai');
const expect = chai.expect;


Feature('OAuth2 flow');


Scenario('Authorization code flow: Test that fails to generate code due to no user consent', async (fence) => {
  const resULR = await fence.do.getConsentCode(
    fence.props.clients.client.id, 'code', 'openid+user', 'cancel', false
  );
  fence.ask.assertNotContainSubStr(resULR, ['code=']);
});

/**
 * DISABLED!!!
 * OAUTH with Google 
 */
Scenario('Authorization code flow: Test that successfully generates code', async (fence) => {
  const resULR = await fence.do.getConsentCode(
    fence.props.clients.client.id, 'code', 'openid+user',
  );
  fence.ask.assertContainSubStr(resULR, ['code=']);
});

Scenario('Authorization code flow: Test that fail to generate code due to not provided openid scope', async (fence) => {
  const resULR = await fence.do.getConsentCode(
    fence.props.clients.client.id, 'code', 'user', 'ok', false
  );
  fence.ask.assertNotContainSubStr(resULR, ['code=']);
});

Scenario('Authorization code flow: Test that fail to generate code due to wrong response type', async (fence) => {
  const resULR = await fence.do.getConsentCode(
    fence.props.clients.client.id, 'wrong_code', 'user', 'yes', false
  );
  fence.ask.assertNotContainSubStr(resULR, ['code=']);
});

Scenario('Authorization code flow: Test that successfully generate tokens', async (fence) => {
  const urlStr = await fence.do.getConsentCode(fence.props.clients.client.id, 'code', 'openid+user');
  fence.ask.assertContainSubStr(urlStr, ['code=']);
  const match = urlStr.match(RegExp('/?code=(.*)'));
  const code = match && match[1];
  fence.ask.assertTruethyResult(code);
  const res = await fence.do.getTokensWithAuthCode(
    fence.props.clients.client.id,
    fence.props.clients.client.secret, code, 'authorization_code',
  );
  fence.ask.asssertTokensSuccess(res);
});

Scenario('Authorization code flow: Test that fails to generate tokens due to invalid code', async (fence) => {
  const res = await fence.do.getTokensWithAuthCode(
    fence.props.clients.client.id,
    fence.props.clients.client.secret,
    'invalide_code', 'authorization_code');
  fence.ask.assertStatusCode(res, 400);
});

Scenario('Authorization code flow: Test that fails to generate tokens due to invalid grant type', async (fence) => {
  const urlStr = await fence.do.getConsentCode(
    fence.props.clients.client.id, 'code', 'openid+user',
  );
  fence.ask.assertContainSubStr(urlStr, ['code=']);
  const match = urlStr.match(RegExp('/?code=(.*)'));
  const code = match && match[1];
  fence.ask.assertTruethyResult(code);
  const res = await fence.do.getTokensWithAuthCode(
    fence.props.clients.client.id, fence.props.clients.client.secret, code, 'not_supported',
  );
  fence.ask.assertStatusCode(res, 400);
});

Scenario('Authorization code flow: Test that can create an access token which can be used in fence', async (fence) => {
  const urlStr = await fence.do.getConsentCode(
    fence.props.clients.client.id, 'code', 'openid+user');
  fence.ask.assertContainSubStr(urlStr, ['code=']);
  const match = urlStr.match(RegExp('/?code=(.*)'));
  const code = match && match[1];
  fence.ask.assertTruethyResult(code);
  let res = await fence.do.getTokensWithAuthCode(
    fence.props.clients.client.id,
    fence.props.clients.client.secret, code, 'authorization_code',
  );
  res = await fence.do.getUserInfo(res.body.access_token);
  fence.ask.assertUserInfo(res);
});

Scenario.only('Authorization code flow: Test project access in id token same as project access in user endpoint @reqGoogle', async (fence) => {
  /**
   * Example list of projects the user has access to:
   * projects = {
   *  DEV: [ 'read', 'create', 'upload', 'update', 'delete' ],
   *  QA: [ 'read' ]
   * }
   */

  // get an access token
  const urlStr = await fence.do.getConsentCode(
    fence.props.clients.client.id, 'code', 'openid+user');
  fence.ask.assertContainSubStr(urlStr, ['code=']);
  const match = urlStr.match(RegExp('/?code=(.*)'));
  const code = match && match[1];
  fence.ask.assertTruethyResult(code);
  let res = await fence.do.getTokensWithAuthCode(
    fence.props.clients.client.id,
    fence.props.clients.client.secret, code, 'authorization_code',
  );
  let id_token = res.body.id_token

  // list of projects the token gives access to
  var base64Url = id_token.split('.')[1];
  var base64 = base64Url.replace('-', '+').replace('_', '/');
  tokenClaims = JSON.parse(atob(base64));
  projectsInToken = tokenClaims.context.user.projects;

  // list of projects the user endpoint shows access to
  userInfoRes = await fence.do.getUserInfo(id_token);
  fence.ask.assertUserInfo(userInfoRes);
  projectsOfUser = userInfoRes.body.project_access;

  // test object equality
  projects = Object.getOwnPropertyNames(projectsInToken);
  expect(
    projects.length,
    `Number of projects with access is not identical in token and user info`
  ).to.equal(Object.getOwnPropertyNames(projectsOfUser).length)
  for (var i = 0; i < projects.length; i++) {
    var p = projects[i];
    // test list equality
    expect(
      JSON.stringify(projectsInToken[p].sort()),
      `Access to project ${p} is not identical in token and user info`
    ).to.equal(JSON.stringify(projectsOfUser[p].sort()));
  }
});

// Scenario('Authorization Code flow: Test successfully refresh token', async (fence) => {
//   const urlStr = await fence.do.getConsentCode(
//     fence.props.clients.client.id,
//     'code', 'openid+user',
//   );
//   const match = urlStr.match(RegExp('/?code=(.*)'));
//   const code = match && match[1];
//   let res = await fence.do.getTokensWithAuthCode(
//     fence.props.clients.client.id,
//     fence.props.clients.client.secret,
//     code, 'authorization_code',
//   );
//   res = await fence.do.refreshAccessToken(
//     fence.props.clients.client.id,
//     fence.props.clients.client.secret,
//     res.body.refresh_token.trim(), 'openid+user', 'refresh_token',
//   );
//   fence.ask.assertRefreshAccessToken(res);
//   res = await fence.do.getUserInfo(res.body.access_token);
//   fence.ask.assertUserInfo(res);
// });

Scenario('Implicit flow: Test that fails to generate tokens due to no user consent', async (fence) => {
  const resULR = await fence.do.getTokensImplicitFlow(
    fence.props.clients.clientImplicit.id, 'id_token+token', 'openid+user', 'cancel', false);
  fence.ask.assertNotContainSubStr(resULR, ['token_type=Bearer', 'id_token=', 'access_token=']);
});

Scenario('Implicit flow: Test that successfully generates id and access tokens', async (fence) => {
  const resULR = await fence.do.getTokensImplicitFlow(
    fence.props.clients.clientImplicit.id, 'id_token+token', 'openid+user',
  );
  fence.ask.assertContainSubStr(
    resULR,
    ['token_type=Bearer', 'id_token=', 'access_token=', 'expires_in'],
  );
});

Scenario('Implicit flow: Test that fails to generate tokens due to wrong grant types', async (fence) => {
  const resULR = await fence.do.getTokensImplicitFlow(
    fence.props.clients.clientImplicit.id, 'not_supported_grant', 'openid+user', 'ok', false);
  fence.ask.assertNotContainSubStr(resULR, ['token_type=Bearer', 'id_token=', 'access_token=']);
});

Scenario('Implicit flow: Test that successfully generates only id token', async (fence) => {
  const resULR = await fence.do.getTokensImplicitFlow(
    fence.props.clients.clientImplicit.id, 'id_token', 'openid+user');
  fence.ask.assertContainSubStr(resULR, ['token_type=Bearer', 'id_token=', 'expires_in']);
  fence.ask.assertNotContainSubStr(resULR, ['access_token=']);
});

Scenario('Implicit flow: Test that fails to generate tokens due to openid scope not provided', async (fence) => {
  const resULR = await fence.do.getTokensImplicitFlow(
    fence.props.clients.clientImplicit.id, 'id_token', 'user', 'ok', false);
  fence.ask.assertNotContainSubStr(resULR, ['token_type=Bearer', 'id_token=', 'access_token=']);
});


Scenario('Implicit flow: Test that can create an access token which can be used in fence', async (fence) => {
  const resULR = await fence.do.getTokensImplicitFlow(
    fence.props.clients.clientImplicit.id, 'id_token+token', 'openid+user');
  const match = resULR.match(RegExp('access_token=(.*)&expires'));
  const token = match && match[1];
  fence.ask.assertTruethyResult(token);
  const res = await fence.do.getUserInfo(token.trim());
  fence.ask.assertUserInfo(res);
});

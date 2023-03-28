/*eslint-disable */
const chai = require('chai');

const { expect } = chai;

const apiUtil = require('../../utils/apiUtil.js');


Feature('OAuth2 flow @requires-fence');


Scenario('Authorization code flow: Test that fails to generate code due to no user consent @reqGoogle', async ({ fence }) => {
  const resULR = await fence.do.getConsentCode(
    fence.props.clients.client.id, 'code', 'openid+user', 'cancel', true,
  );
  fence.ask.assertNotContainSubStr(resULR, ['code=']);
});

/**
 * DISABLED!!!
 * OAUTH with Google
 */
Scenario('Authorization code flow: Test that successfully generates code @reqGoogle', async ({ fence }) => {
  const resULR = await fence.do.getConsentCode(
    fence.props.clients.client.id, 'code', 'openid+user',
  );
  fence.ask.assertContainSubStr(resULR, ['code=']);
});

Scenario('Authorization code flow: Test that fail to generate code due to not provided openid scope @reqGoogle', async ({ fence }) => {
  const resULR = await fence.do.getConsentCode(
    fence.props.clients.client.id, 'code', 'user', 'ok', false,
  );
  fence.ask.assertNotContainSubStr(resULR, ['code=']);
});

Scenario('Authorization code flow: Test that fail to generate code due to wrong response type @reqGoogle', async ({ fence }) => {
  const resULR = await fence.do.getConsentCode(
    fence.props.clients.client.id, 'wrong_code', 'user', 'yes', false,
  );
  fence.ask.assertNotContainSubStr(resULR, ['code=']);
});

Scenario('Authorization code flow: Test that successfully generate tokens @reqGoogle', async ({ fence }) => {
  const urlStr = await fence.do.getConsentCode(fence.props.clients.client.id, 'code', 'openid+user');
  fence.ask.assertContainSubStr(urlStr, ['code=']);
  const match = urlStr.match(RegExp('/?code=(.*)'));
  const code = match && match[1];
  fence.ask.assertTruthyResult(
    code,
    `fence\'s oauth2/authorize endpoint should have returned a consent code in url "${urlStr}"`,
  );
  const res = await fence.do.getTokensWithAuthCode(
    fence.props.clients.client.id,
    fence.props.clients.client.secret, code, 'authorization_code',
  );
  fence.ask.assertTokensSuccess(res);
});

Scenario('Authorization code flow: Test that fails to generate tokens due to invalid code @reqGoogle', async ({ fence }) => {
  const res = await fence.do.getTokensWithAuthCode(
    fence.props.clients.client.id,
    fence.props.clients.client.secret,
    'invalide_code', 'authorization_code',
  );
  fence.ask.assertStatusCode(res, 400);
});

Scenario('Authorization code flow: Test that fails to generate tokens due to invalid grant type @reqGoogle', async ({ fence }) => {
  const urlStr = await fence.do.getConsentCode(
    fence.props.clients.client.id, 'code', 'openid+user',
  );
  fence.ask.assertContainSubStr(urlStr, ['code=']);
  const match = urlStr.match(RegExp('/?code=(.*)'));
  const code = match && match[1];
  fence.ask.assertTruthyResult(
    code,
    `fence\'s oauth2/authorize endpoint should have returned a consent code in url "${urlStr}"`,
  );
  const res = await fence.do.getTokensWithAuthCode(
    fence.props.clients.client.id, fence.props.clients.client.secret, code, 'not_supported',
  );
  fence.ask.assertStatusCode(res, 400);
});

Scenario('Authorization code flow: Test that can create an access token which can be used in fence @reqGoogle', async ({ fence }) => {
  const urlStr = await fence.do.getConsentCode(
    fence.props.clients.client.id, 'code', 'openid+user',
  );
  fence.ask.assertContainSubStr(urlStr, ['code=']);
  const match = urlStr.match(RegExp('/?code=(.*)'));
  const code = match && match[1];
  fence.ask.assertTruthyResult(
    code,
    `fence\'s oauth2/authorize endpoint should have returned a consent code in url "${urlStr}"`,
  );
  let res = await fence.do.getTokensWithAuthCode(
    fence.props.clients.client.id,
    fence.props.clients.client.secret, code, 'authorization_code',
  );
  res = await fence.do.getUserInfo(res.data.access_token);
  fence.ask.assertUserInfo(res);
});

Scenario('Authorization code flow: Test project access in id token same as project access in user endpoint @reqGoogle @wip', async ({ fence, users, home }) => {
  /**
   * Example list of projects the user has access to:
   * projects = {
   *  DEV: [ 'read', 'create', 'upload', 'update', 'delete' ],
   *  QA: [ 'read' ]
   * }
   */

  // login as a user who has access to some projects
  await home.complete.login(users.mainAcct);

  // get an access token
  const urlStr = await fence.do.getConsentCode(
    fence.props.clients.client.id, 'code', 'openid+user',
  );
  fence.ask.assertContainSubStr(urlStr, ['code=']);
  const match = urlStr.match(RegExp('/?code=(.*)'));
  const code = match && match[1];
  fence.ask.assertTruthyResult(
    code,
    `fence\'s oauth2/authorize endpoint should have returned a consent code in url "${urlStr}"`,
  );
  const res = await fence.do.getTokensWithAuthCode(
    fence.props.clients.client.id,
    fence.props.clients.client.secret, code, 'authorization_code',
  );
  const { access_token } = res.data;
  const { id_token } = res.data;

  // list of projects the id token gives access to
  tokenClaims = apiUtil.parseJwt(id_token);
  projectsInToken = tokenClaims.context.user.projects;
  if (process.env.DEBUG === 'true') {
    console.log('list of projects the id token gives access to:');
    console.log(projectsInToken);
  }

  // list of projects the user endpoint shows access to
  userInfoRes = await fence.do.getUserInfo(access_token);
  fence.ask.assertUserInfo(userInfoRes);
  projectsOfUser = userInfoRes.data.project_access;
  if (process.env.DEBUG === 'true') {
    console.log('list of projects the user endpoint shows access to:');
    console.log(projectsOfUser);
  }

  // test object equality
  projects = Object.getOwnPropertyNames(projectsInToken);
  expect(
    projects.length,
    'Number of projects with access is not identical in token and user info',
  ).to.equal(Object.getOwnPropertyNames(projectsOfUser).length);
  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];
    // test list equality
    expect(
      JSON.stringify(projectsInToken[p].sort()),
      `Access to project ${p} is not identical in token and user info`,
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
//     res.data.refresh_token.trim(), 'openid+user', 'refresh_token',
//   );
//   fence.ask.assertRefreshAccessToken(res);
//   res = await fence.do.getUserInfo(res.data.access_token);
//   fence.ask.assertUserInfo(res);
// });

Scenario('Implicit flow: Test that fails to generate tokens due to no user consent @reqGoogle', async ({ fence }) => {
  const resULR = await fence.do.getTokensImplicitFlow(
    fence.props.clients.clientImplicit.id, 'id_token+token', 'openid+user', 'cancel', true,
  );
  fence.ask.assertNotContainSubStr(resULR, ['token_type=Bearer', 'id_token=', 'access_token=']);
});

Scenario('Implicit flow: Test that successfully generates id and access tokens @reqGoogle', async ({ fence }) => {
  const resULR = await fence.do.getTokensImplicitFlow(
    fence.props.clients.clientImplicit.id, 'id_token+token', 'openid+user',
  );
  fence.ask.assertContainSubStr(
    resULR,
    ['token_type=Bearer', 'id_token=', 'access_token=', 'expires_in'],
  );
});

Scenario('Implicit flow: Test that fails to generate tokens due to wrong grant types @reqGoogle', async ({ fence }) => {
  const resULR = await fence.do.getTokensImplicitFlow(
    fence.props.clients.clientImplicit.id, 'not_supported_grant', 'openid+user', 'ok', false,
  );
  fence.ask.assertNotContainSubStr(resULR, ['token_type=Bearer', 'id_token=', 'access_token=']);
});

Scenario('Implicit flow: Test that successfully generates only id token @reqGoogle', async ({ fence }) => {
  const resULR = await fence.do.getTokensImplicitFlow(
    fence.props.clients.clientImplicit.id, 'id_token', 'openid+user',
  );
  fence.ask.assertContainSubStr(resULR, ['token_type=Bearer', 'id_token=', 'expires_in']);
  fence.ask.assertNotContainSubStr(resULR, ['access_token=']);
});

Scenario('Implicit flow: Test that fails to generate tokens due to openid scope not provided @reqGoogle', async ({ fence }) => {
  const resULR = await fence.do.getTokensImplicitFlow(
    fence.props.clients.clientImplicit.id, 'id_token', 'user', 'ok', false,
  );
  fence.ask.assertNotContainSubStr(resULR, ['token_type=Bearer', 'id_token=', 'access_token=']);
});


Scenario('Implicit flow: Test that can create an access token which can be used in fence @reqGoogle', async ({ fence }) => {
  const resULR = await fence.do.getTokensImplicitFlow(
    fence.props.clients.clientImplicit.id, 'id_token+token', 'openid+user',
  );
  const match = resULR.match(RegExp('access_token=(.*)'));
  let token = match && match[1];
  token = token.split('&')[0]; // remove other query parameters
  fence.ask.assertTruthyResult(
    token,
    `fence\'s oauth2/authorize endpoint in implicit flow should have returned an access token in url "${resULR}"`,
  );
  const res = await fence.do.getUserInfo(token.trim());
  fence.ask.assertUserInfo(res);
});

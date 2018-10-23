Feature('OAuth2 flow');

Scenario('Basic flow: Test that successfuly generates code', async (fence) => {
  const resULR = await fence.do.getConsentCode(fence.props.clients.client.id, 'code', 'openid+user');
  //fence.ask.authorizeClientSuccess(code);
  fence.ask.assertURLString(resULR, ['code='], []);
});

Scenario('Basic flow: Test that fail to generate code due to not provided openid scope', async (fence) => {
  const resULR = await fence.do.getConsentCode(fence.props.clients.client.id, 'code', 'user');
  fence.ask.assertURLString(resULR, [], ['code=']);
});

Scenario('Basic flow: Test that successfully generate tokens', async (fence) => {
  const urlStr = await fence.do.getConsentCode(fence.props.clients.client.id, 'code', 'openid+user');
  const match = urlStr.match(RegExp('/?code=(.*)'));
  const code = match[1];
  const res = await fence.do.getTokensWithAuthCode(fence.props.clients.client.id, fence.props.clients.client.secret, code, 'authorization_code');
  fence.ask.getTokensSuccess(res);
});

Scenario('Basic flow: Test that fails to generate tokens due to invalid code', async (fence) => {
  const code = 'invalide_code';
  const res = await fence.do.getTokensWithAuthCode(fence.props.clients.client.id, fence.props.clients.client.secret, code, 'authorization_code');
  fence.ask.getTokensFail(res);
});

Scenario('Basic flow: Test that fails to generate tokens due to invalid grant type', async (fence) => {
  const urlStr = await fence.do.getConsentCode(fence.props.clients.client.id, 'code', 'openid+user');
  const match = urlStr.match(RegExp('/?code=(.*)'));
  const code = match[1];
  const res = await fence.do.getTokensWithAuthCode(fence.props.clients.client.id, fence.props.clients.client.secret, code, 'not_supported');
  fence.ask.getTokensFail(res);
});

Scenario('Implicit flow: Test that successfuly generates id and access tokens', async (fence) => {
  const resULR = await fence.do.getTokensImplicitFlow(fence.props.clients.clientImplicit.id, 'id_token+token', 'openid+user');
  fence.ask.assertURLString(resULR, ['token_type=Bearer', 'id_token=', 'access_token='], []);
});

Scenario('Implicit flow: Test that fails to generate tokens due to wrong grant types', async (fence) => {
  const resULR = await fence.do.getTokensImplicitFlow(fence.props.clients.clientImplicit.id, 'not_supported_grant', 'openid+user');
  fence.ask.assertURLString(resULR, [], ['token_type=Bearer', 'id_token=', 'access_token=']);
});

Scenario('Implicit flow: Test that successfuly generates only id token', async (fence) => {
  const resULR = await fence.do.getTokensImplicitFlow(fence.props.clients.clientImplicit.id, 'id_token', 'openid+user');
  fence.ask.assertURLString(resULR, ['token_type=Bearer', 'id_token='], ['access_token=']);
});

Scenario('Implicit flow: Test that fails to generate tokens due to openid scope not provided', async (fence) => {
  const resULR = await fence.do.getTokensImplicitFlow(fence.props.clients.clientImplicit.id, 'id_token', 'user');
  fence.ask.assertURLString(resULR, [], ['token_type=Bearer', 'id_token=', 'access_token=']);
});

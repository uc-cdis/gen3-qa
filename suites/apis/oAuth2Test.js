Feature('oAuth2');

Scenario('test successfuly generate code', async (fence) => {
  const code = await fence.do.getConsentCode(fence.props.clients.client.id, 'code', 'openid+user');
  fence.ask.authorizeClientSuccess(code);
});

Scenario('test fail to generate code', async (fence) => {
  const code = await fence.do.getConsentCode(fence.props.clients.client.id, 'code', 'user');
  fence.ask.authorizeClientFail(code);
});

Scenario('test successfully getnerate tokens', async (fence) => {
  const code = await fence.do.getConsentCode(fence.props.clients.client.id, 'code', 'openid+user');
  const res = await fence.do.getTokensWithAuthCode(fence.props.clients.client.id, fence.props.clients.client.secret, code);
  fence.ask.getTokensSuccess(res);

});
Feature('UserTokenAPI @requires-fence');

Scenario('test create APIKey success', async ({ fence, users }) => {
  const scope = ['data', 'user'];
  const apiKeyRes = await fence.do.createAPIKey(
    scope,
    users.mainAcct.accessTokenHeader,
  );
  fence.ask.hasAPIKey(apiKeyRes);
  fence.do.deleteAPIKey(apiKeyRes.key_id);
});

Scenario('create APIKey with expired access token', async ({ fence, users }) => {
  const scope = ['data', 'user'];
  const authHeader = await users.mainAcct.getExpiredAccessTokenHeader();
  const apiKeyRes = await fence.do.createAPIKey(
    scope,
    authHeader,
  );
  fence.ask.responsesEqual(apiKeyRes, fence.props.resExpiredAccessToken);
});

Scenario('refresh access token with apiKey', async ({ fence, users }) => {
  const scope = ['data', 'user'];
  const apiKeyRes = await fence.complete.createAPIKey(scope, users.mainAcct.accessTokenHeader);
  const accessTokenRes = await fence.do.getAccessToken(apiKeyRes.data.api_key);
  fence.ask.hasAccessToken(accessTokenRes);
  fence.do.deleteAPIKey(apiKeyRes.data.key_id);
});

Scenario('refresh access token with invalid apiKey', async ({ fence }) => {
  const accessTokenRes = await fence.do.getAccessToken('invalid');
  fence.ask.responsesEqual(accessTokenRes, fence.props.resInvalidAPIKey);
});

Scenario('refresh access token without apiKey', async ({ fence }) => {
  const accessTokenRes = await fence.do.getAccessToken(null);
  fence.ask.responsesEqual(accessTokenRes, fence.props.resMissingAPIKey);
});

Feature('UserTokenAPI');

let keyId = null;
let apiKey = null;

Scenario('test create APIKey success', async (fence, commons) => {
  const scope = ['data', 'user'];
  const apiKeyRes = await fence.do.createAPIKey(
    scope,
    commons.validAccessTokenHeader,
  );
  fence.ask.hasAPIKey(apiKeyRes);
  keyId = apiKeyRes.body.keyId;
  apiKey = apiKeyRes.body.apiKey;
});

Scenario('create APIKey with expired access token', async (fence, commons) => {
  const scope = ['data', 'user'];
  const apiKeyRes = await fence.do.createAPIKey(
    scope,
    commons.expiredAccessTokenHeader,
  );
  fence.ask.hasError(
    apiKeyRes,
    401,
    'Authentication Error: Signature has expired',
  );
});

Scenario('refresh access token with apiKey', async (fence) => {
  const accessTokenRes = await fence.do.getAccessToken(apiKey);
  fence.ask.hasAccessToken(accessTokenRes);
});

Scenario('refresh access token with invalid apiKey', async (fence) => {
  const accessTokenRes = await fence.do.getAccessToken('invalid');
  fence.ask.hasError(accessTokenRes, 401, 'Not enough segments');
});

Scenario('refresh access token without apiKey', async (fence) => {
  const accessTokenRes = await fence.do.getAccessToken(null);
  fence.ask.hasError(
    accessTokenRes,
    400,
    'Please provide an apiKey in payload',
  );
});

AfterSuite((fence) => {
  if (keyId !== null) {
    fence.do.deleteAPIKey(keyId);
  }
});

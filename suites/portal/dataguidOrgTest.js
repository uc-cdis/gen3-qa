Feature('Dataguid.org @requires-portal');

const { Bash } = require('../../utils/bash.js');

const bash = new Bash();

let testURL = '';
if (process.env.RUNNING_LOCAL === 'true') {
  testURL = 'https://dataguids.org';
} else {
  testURL = `https://${process.env.NAMESPACE}.planx-pla.net`;
  if (process.env.DEBUG === 'true') {
    console.log(`testURL: ${testURL}`);
  }
}
const nonexistentGuids = new DataTable(['nguids']);
nonexistentGuids.add(['dg.ABCD/0000b4b4-2af4-42e2-9bfa-6fd11e5fb97a']); // adding guids with wrong prefix
nonexistentGuids.add(['0000b456-3r56-1dr3-0rt4-6fd11e5fb97a']); // adding non-existent guids

async function getAllHost() {
  console.log('###Getting all hosts from manifest.json');
  await bash.runCommand('g3kubectl get configmap manifest-all -o json | jq .data.json > manifest.json');
  await bash.runCommand('echo -e $(cat manifest.json) | sed \'s/\\\\//g\' | sed \'1s/^.//\' | sed \'$s/.$//\' > dataguidmanifest.json');
  const res = await bash.runCommand('cat dataguidmanifest.json | jq -r \'.indexd.dist[] | select(.type == "indexd") | .host\'');
  if (process.env.DEBUG === 'true') {
    console.log(res);
  }
  const hosts = res.match(/https:[\/\-\.\w]+\/index\//g); // eslint-disable-line
  if (process.env.DEBUG === 'true') {
    console.log(hosts);
  }

  await bash.runCommand('rm manifest.json; rm dataguidmanifest.json');
  return hosts;
}

async function getFirstGuidFromHost(host, I) {
  const guid = await I.sendGetRequest(`${host}index?limit=1`)
    .then((res) => res.data.records[0].did);
  if (process.env.DEBUG === 'true') {
    console.log(guid);
  }

  return guid;
}

BeforeSuite(async ({ I }) => {
  // init I.cache
  I.cache = {};
  I.cache.correctGuids = [];
  const hosts = await getAllHost();
  for (let i = 0; i < hosts.length; i += 1) {
    // skip hosts not owned by CTDS
    if (!hosts[i].includes('repo.data.nesi.org.nz') && !hosts[i].includes('data.agdr.org.nz') && !hosts[i].includes('gen3.agha.umccr.org')) {
      const guid = await getFirstGuidFromHost(hosts[i], I);
      I.cache.correctGuids.push(guid);
    }
  }
});

// Test resolving guids
Scenario('Resolve guids with different prefixes or without prefix @dataguids', ({ I }) => {
  for (let i = 0; i < I.cache.correctGuids.length; i += 1) {
    const correctGuid = I.cache.correctGuids[i];
    I.amOnPage(testURL);
    I.fillField('#guidval', correctGuid);
    I.scrollIntoView('#resolveit');
    I.forceClick('#resolveit');
    I.waitForText(correctGuid, 30, '#resolverresult');
    I.see(`"id": "${correctGuid}"`);
  }
});

// Test DRS endpoint
Scenario('Test if DRSendpoint resolve the guids correctly @dataguids', ({ I }) => {
  for (let i = 0; i < I.cache.correctGuids.length; i += 1) {
    const correctGuid = I.cache.correctGuids[i];
    I.amOnPage(`${testURL}/ga4gh/dos/v1/dataobjects/${correctGuid}`);
    I.see(`${correctGuid}`);
  }
});

// Nagative resolving guids test
Data(nonexistentGuids).Scenario('Negativetest resolving for non-exitent guids @dataguids', ({ I, current }) => {
  I.amOnPage(testURL);
  I.fillField('#guidval', current.nguids);
  I.forceClick('#resolveit');
  I.waitForText(`Data GUID "${current.nguids}" not found.`, 30, '#resolverresult');
}).retry(2);


// Nagative DRS endpoint test
Data(nonexistentGuids).Scenario('Negativetest DRSendpoint with non-existent guids @dataguids', ({ I, current }) => {
  I.amOnPage(`${testURL}/ga4gh/dos/v1/dataobjects/${current.nguids}`);
  I.see('no record found');
}).retry(2);

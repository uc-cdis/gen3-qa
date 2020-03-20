const { Client } = require('@elastic/elasticsearch');
const { Bash } = require('./bash');

const service = 'aws-es-proxy-deployment';
const bash = new Bash();
const ES_URL = 'http://localhost:9200';

module.exports = {
  search: async (index, query) => {
    const res = bash.runCommand(`g3kubectl port-forward deployment/${service} 9200:9200 &`);
    console.log(res);
    const client = new Client({ node: ES_URL });
    const resp = await client.search({
      index,
      body: query,
    });
    return resp.body.hits.hits;
  },
};

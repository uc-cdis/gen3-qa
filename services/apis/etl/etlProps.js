/**
 * indexd Properties
 */
const apiRoot = 'http://esproxy-service:9200';
module.exports = {
  /**
   * es endpoints
   */
  endpoints: {
    root: apiRoot,
    alias: `${apiRoot}/_alias`,
  },
  aliases: [`${process.env.NAMESPACE}_etl`, `${process.env.NAMESPACE}_file`],
};

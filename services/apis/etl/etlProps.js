/**
 * indexd Properties
 */
const apiRoot = 'http://localhost:9200';
module.exports = {
  /**
   * es endpoints
   */
  endpoints: {
    root: apiRoot,
    alias: `${apiRoot}/_alias`,
  },
  aliases: [`etl_${process.env.NAMESPACE}`, `file_${process.env.NAMESPACE}`, `${process.env.NAMESPACE}_etl`, `${process.env.NAMESPACE}_file`],
};

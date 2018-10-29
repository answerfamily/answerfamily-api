const DataLoader = require('dataloader');
const esClient = require('../lib/esClient');
const processMeta = require('../lib/esMeta');
const getInFactory = require('../lib/getInFactory');

/**
 * Given an ElasticSearch search context {index: ..., body: ...},
 * returns corresponding search result as an array of found documents
 */
module.exports = () =>
  new DataLoader(
    async searchContexts => {
      const mSearchBody = [];
      searchContexts.forEach(({ body, ...otherContext }) => {
        mSearchBody.push(otherContext);
        mSearchBody.push(body);
      });

      return (await esClient.msearch({ body: mSearchBody })).responses.map(
        resp => {
          if (resp.error) throw new Error(JSON.stringify(resp.error));
          const getIn = getInFactory(resp);
          return getIn(['hits', 'hits'], []).map(processMeta);
        }
      );
    },
    {
      cacheKeyFn: JSON.stringify,
    }
  );

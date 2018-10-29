const DataLoader = require('dataloader');
const esClient = require('../lib/esClient');
const processMeta = require('../lib/esMeta');

/**
 * Given { index, id },
 * returns corresponding document from ElasticSearch
 */
module.exports = () =>
  new DataLoader(
    async indexAndIds => {
      const docs = indexAndIds.map(({ index, id }) => ({
        _index: index,
        _id: id,
        _type: '_doc',
      }));

      return (await esClient.mget({
        body: { docs },
      })).docs.map(processMeta);
    },
    {
      cacheKeyFn: ({ index, id }) => `/${index}/${id}`,
    }
  );

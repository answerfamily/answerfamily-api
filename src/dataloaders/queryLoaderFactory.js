const DataLoader = require('dataloader');
const mongoClient = require('../lib/mongoClient');

/**
 * Given a MongoDB collection, query, key to specify ID, and the value,
 * return all MongoDB document that whose key is the value
 */
module.exports = (loaders, collectionName, key = '_id') =>
  new DataLoader(
    async values => {
      const { db } = await mongoClient;
      const results = await db
        .collection(collectionName)
        .aggregate([
          {
            $match: {
              [key]: { $in: values },
            },
          },
          {
            $group: {
              _id: `$${key}`,
              docs: { $push: '$$ROOT' },
            },
          },
        ])
        .toArray();

      return values.map(id => {
        const result = results.find(({ _id }) => _id === id);
        if (result) return result.docs;
        return null;
      });
    },
    {
      cacheKeyFn: value => `${collectionName}/${key}/${value}`,
    }
  );

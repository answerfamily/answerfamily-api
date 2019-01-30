const DataLoader = require('dataloader');
const mongoClient = require('../lib/mongoClient');

/**
 * Given a MongoDB collection, query, key to specify ID, and the value,
 * return all MongoDB document that whose key is the value
 */
module.exports = () =>
  new DataLoader(async urls => {
    const { db } = await mongoClient;
    const results = await db
      .collection('urlFetchRecords')
      .find({
        $or: [{ url: { $in: urls } }, { canonicalUrl: { $in: urls } }],
        status: { $lt: 400 },
      })
      .toArray();

    // Map all records to each requested urls
    //
    return urls.map(url =>
      results.reduce((currentLatestRecord, record) => {
        // skip non-matched results
        if (record.url !== url && record.canonicalUrl !== url) {
          return currentLatestRecord;
        }

        // skip old fetches
        if (
          currentLatestRecord &&
          record.fetchedAt < currentLatestRecord.fetchedAt
        ) {
          return currentLatestRecord;
        }

        return record;
      }, null)
    );
  });

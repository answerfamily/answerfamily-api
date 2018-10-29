require('../src/lib/catchUnhandledRejection');
const esClient = require('../src/lib/esClient');
const mongoClient = require('../src/lib/mongoClient');

// fixtureMap:
// {
//   '/articles/basic/1': { ... body of article 1 ... },
//   '/replies/basic/2': { ... body of reply 2 ... },
// }
//

/**
 * Loads specified fixture to ElasticSearch
 * @param {object} fixtureMap map like {"/articles/id": {...}}
 */
exports.loadESFixtures = async function loadESFixtures(fixtureMap) {
  const body = [];
  const indexes = new Set();
  Object.keys(fixtureMap).forEach(key => {
    const [, _index, _id] = key.split('/');
    body.push({ index: { _index, _type: '_doc', _id } });
    body.push(fixtureMap[key]);
    indexes.add(_index);
  });

  // refresh() should be invoked after bulk insert, or re-index happens every 1 seconds
  //
  // ref: https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-update-settings.html#bulk
  //      https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-refresh.html
  //
  const result = await esClient.bulk({ body, refresh: 'true' });
  if (result.errors) {
    throw new Error(
      `Fixture load failed : ${JSON.stringify(result, null, '  ')}`
    );
  }
};

exports.unloadESFixtures = async function unloadESFixtures(fixtureMap) {
  const indexes = new Set();
  const body = Object.keys(fixtureMap).map(key => {
    const [, _index, _id] = key.split('/');
    indexes.add(_index);
    return { delete: { _index, _type: '_doc', _id } };
  });

  await esClient.bulk({ body, refresh: 'true' });
};

/**
 * Resets specified key to fixtureMap for ElasticSearch
 * @param {objext} fixtureMap map like {"/articles/id": {...}}
 */
exports.resetFrom = async function resetFrom(fixtureMap, key) {
  const [, index, id] = key.split('/');
  await esClient.update({
    index,
    type: '_doc',
    id,
    body: {
      doc: fixtureMap[key],
    },
    refresh: true,
  });
};

/**
 * @param {object} fixtureMap map like {collectionName: [{document...}, ...]}
 */
exports.loadMongoFixtures = async function loadMongoFixtures(fixtureMap) {
  const { db } = await mongoClient;

  for (let collectionName of Object.keys(fixtureMap)) {
    await db.collection(collectionName).deleteMany();
    await db.collection(collectionName).insertMany(fixtureMap[collectionName]);
  }
};

exports.unloadMongoFixtures = async function unloadMongoFixtures(fixtureMap) {
  const { db } = await mongoClient;

  for (let collectionName of Object.keys(fixtureMap)) {
    const ids = fixtureMap[collectionName].map(({ _id }) => _id);
    await db.collection(collectionName).deleteMany({ _id: { $in: ids } });
  }
};

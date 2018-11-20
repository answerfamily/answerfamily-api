jest.mock('../dataloaders/auth0UserLoaderFactory');

const {
  loadESFixtures,
  unloadESFixtures,
  loadMongoFixtures,
  unloadMongoFixtures,
} = require('../../test/fixtures');
const gql = require('../../test/gql');
const {
  ES_FIXTURES,
  MONGO_FIXTURES,
} = require('../__fixtures__/articleParagraphReply');
const mongoClient = require('../lib/mongoClient');

describe('deleteSource', () => {
  beforeAll(async () => {
    await loadESFixtures(ES_FIXTURES);
    await loadMongoFixtures(MONGO_FIXTURES);
  });

  afterAll(async () => {
    await unloadESFixtures(ES_FIXTURES);
    await unloadMongoFixtures(MONGO_FIXTURES);
  });

  const targetSource = MONGO_FIXTURES.articleSources[0];
  it('deletes source', async () => {
    const { errors, data } = await gql`
      mutation($sourceId: ObjectId!) {
        deleteSource(sourceId: $sourceId) {
          sources {
            id
          }
        }
      }
    `(
      { sourceId: targetSource._id.toString() },
      {
        userPromise: Promise.resolve({ iss: 'author1' }),
      }
    );

    expect(errors).toBeUndefined();
    expect(data.deleteSource).toMatchSnapshot();

    // cleanup -- add back deleted source
    const { db } = await mongoClient;
    await db.collection('articleSources').insertOne(targetSource);
  });

  it('cannot delete source created by others', async () => {
    const { errors } = await gql`
      mutation($sourceId: ObjectId!) {
        deleteSource(sourceId: $sourceId) {
          sources {
            id
          }
        }
      }
    `(
      { sourceId: targetSource._id.toString() },
      {
        userPromise: Promise.resolve({ iss: 'another-user' }),
      }
    );

    // Should be forbidden
    expect(errors).toMatchSnapshot();
  });

  it('blocks non-logged in users', async () => {
    const { errors } = await gql`
      mutation($sourceId: ObjectId!) {
        deleteSource(sourceId: $sourceId) {
          sources {
            id
          }
        }
      }
    `({ sourceId: targetSource._id.toString().toString() });

    // Should be unauthorized
    expect(errors).toMatchSnapshot();
  });
});

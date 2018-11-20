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

describe('addSourceToArticle', () => {
  beforeAll(async () => {
    await loadESFixtures(ES_FIXTURES);
    await loadMongoFixtures(MONGO_FIXTURES);
  });

  afterAll(async () => {
    await unloadESFixtures(ES_FIXTURES);
    await unloadMongoFixtures(MONGO_FIXTURES);
  });

  const source = {
    url: 'http://unittest.com',
    note: 'description',
  };
  it('creates sources', async () => {
    const { errors, data } = await gql`
      mutation($articleId: String!, $source: ArticleSourceInput!) {
        addSourceToArticle(articleId: $articleId, source: $source) {
          sources {
            note
            url
          }
        }
      }
    `(
      { articleId: 'article1', source },
      {
        userPromise: Promise.resolve({ iss: 'user-id' }),
      }
    );

    expect(errors).toBeUndefined();
    expect(data.addSourceToArticle.sources).toMatchSnapshot();

    // cleanup
    const { db } = await mongoClient;
    await db.collection('sources').deleteMany({ url: source.url });
  });

  it('blocks non-logged in users', async () => {
    const { errors } = await gql`
      mutation($articleId: String!, $source: ArticleSourceInput!) {
        addSourceToArticle(articleId: $articleId, source: $source) {
          id
        }
      }
    `({ articleId: 'article1', source });

    // Should be unauthorzied
    expect(errors).toMatchSnapshot();
  });
});

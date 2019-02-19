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
const esClient = require('../lib/esClient');

describe('deleteArticle', () => {
  beforeAll(async () => {
    await loadESFixtures(ES_FIXTURES);
    await loadMongoFixtures(MONGO_FIXTURES);
  });

  afterAll(async () => {
    await unloadESFixtures(ES_FIXTURES);
    await unloadMongoFixtures(MONGO_FIXTURES);
  });

  it('deletes article and associated paragraphs and paragraphReplies', async () => {
    const { errors, data } = await gql`
      mutation {
        deleteArticle(articleId: "article1")
      }
    `(
      {},
      {
        userPromise: Promise.resolve({ iss: 'author1' }),
      }
    );

    expect(errors).toBeUndefined();
    expect(data.deleteArticle).toBe(true);

    // Expect no article1 article
    expect(
      esClient.get({
        index: 'articles',
        type: '_doc',
        id: 'article1',
      })
    ).rejects.toMatchSnapshot('article not found error');

    // Expect no more article1 paragraphs
    const {
      hits: { total: paragraphTotalCount },
    } = await esClient.search({
      index: 'paragraphs',
      type: '_doc',
      body: {
        query: {
          term: {
            articleId: 'article1',
          },
        },
      },
    });
    expect(paragraphTotalCount).toBe(0);

    // Expect no more paragraph replies
    const { db } = await mongoClient;
    expect(
      await db
        .collection('paragraphReplies')
        .find({ paragraphId: { $in: ['p1', 'p2'] } })
        .toArray()
    ).toHaveLength(0);

    // cleanup -- add back deleted article, paragraph and paragraphReplies
    await esClient.index({
      index: 'articles',
      type: '_doc',
      id: 'article1',
      body: ES_FIXTURES['/articles/article1'],
    });

    await esClient.index({
      index: 'paragraphs',
      type: '_doc',
      id: 'p1',
      body: ES_FIXTURES['/paragraphs/p1'],
    });

    await esClient.index({
      index: 'paragraphs',
      type: '_doc',
      id: 'p2',
      body: ES_FIXTURES['/paragraphs/p2'],
    });

    await db
      .collection('paragraphReplies')
      .insertMany(MONGO_FIXTURES.paragraphReplies);
  });

  it('cannot delete article when author is not current user', async () => {
    const { errors } = await gql`
      mutation {
        deleteArticle(articleId: "article1")
      }
    `(
      {},
      {
        userPromise: Promise.resolve({ iss: 'another-user' }),
      }
    );

    // Should be forbidden
    expect(errors).toMatchSnapshot();
  });

  it('blocks non-logged in users', async () => {
    const { errors } = await gql`
      mutation {
        deleteArticle(articleId: "article1")
      }
    `();

    // Should be unauthorized
    expect(errors).toMatchSnapshot();
  });
});

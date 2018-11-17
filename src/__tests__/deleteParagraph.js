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

describe('deleteParagraph', () => {
  beforeAll(async () => {
    await loadESFixtures(ES_FIXTURES);
    await loadMongoFixtures(MONGO_FIXTURES);
  });

  afterAll(async () => {
    await unloadESFixtures(ES_FIXTURES);
    await unloadMongoFixtures(MONGO_FIXTURES);
  });

  it('deletes paragraph and associated paragraphReplies', async () => {
    const { errors, data } = await gql`
      mutation {
        deleteParagraph(paragraphId: "p1") {
          paragraphs {
            id
          }
        }
      }
    `(
      {},
      {
        userPromise: Promise.resolve({ iss: 'author1' }),
      }
    );

    expect(errors).toBeUndefined();
    expect(data.deleteParagraph).toMatchSnapshot();

    // Expect no more p1 paragraphReplies
    const { db } = await mongoClient;
    expect(
      await db
        .collection('paragraphReplies')
        .find({ paragraphId: 'p1' })
        .toArray()
    ).toHaveLength(0);

    // cleanup -- add back deleted paragraph and paragraphReplies
    await esClient.index({
      index: 'paragraphs',
      type: '_doc',
      id: 'p1',
      body: ES_FIXTURES['/paragraphs/p1'],
    });

    await db
      .collection('paragraphReplies')
      .insertMany(
        MONGO_FIXTURES.paragraphReplies.filter(
          ({ paragraphId }) => paragraphId === 'p1'
        )
      );
  });

  it('cannot disconnect when paragraphReply is not by current user', async () => {
    const { errors } = await gql`
      mutation {
        deleteParagraph(paragraphId: "p1") {
          paragraphs {
            id
          }
        }
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
        deleteParagraph(paragraphId: "p1") {
          paragraphs {
            id
          }
        }
      }
    `();

    // Should be unauthorized
    expect(errors).toMatchSnapshot();
  });
});

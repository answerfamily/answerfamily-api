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

describe('disconnectReplyAndParagraph', () => {
  beforeAll(async () => {
    await loadESFixtures(ES_FIXTURES);
    await loadMongoFixtures(MONGO_FIXTURES);
  });

  afterAll(async () => {
    await unloadESFixtures(ES_FIXTURES);
    await unloadMongoFixtures(MONGO_FIXTURES);
  });

  it('disconnects reply and paragraph', async () => {
    const ids = { replyId: 'r1', paragraphId: 'p1' };

    const { errors, data } = await gql`
      mutation($replyId: String!, $paragraphId: String!) {
        disconnectReplyAndParagraph(
          replyId: $replyId
          paragraphId: $paragraphId
        ) {
          paragraphReplies {
            reply {
              id
            }
            user {
              id
              name
            }
          }
        }
      }
    `(ids, {
      userPromise: Promise.resolve({ iss: 'author1' }),
    });

    expect(errors).toBeUndefined();
    expect(data.disconnectReplyAndParagraph).toMatchSnapshot();

    // cleanup -- add back deleted reply
    const { db } = await mongoClient;
    await db
      .collection('paragraphReplies')
      .insertOne(
        MONGO_FIXTURES.paragraphReplies.find(
          ({ replyId, paragraphId }) => replyId === 'r1' && paragraphId === 'p1'
        )
      );
  });

  it('cannot disconnect when paragraphReply is not by current user', async () => {
    const { errors } = await gql`
      mutation {
        disconnectReplyAndParagraph(replyId: "r1", paragraphId: "p1") {
          paragraphReplies {
            reply {
              id
            }
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
        disconnectReplyAndParagraph(replyId: "r1", paragraphId: "p2") {
          paragraphReplies {
            reply {
              id
            }
          }
        }
      }
    `();

    // Should be unauthorized
    expect(errors).toMatchSnapshot();
  });
});

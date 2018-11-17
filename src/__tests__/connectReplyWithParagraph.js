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

describe('connectReplyWithParagraph', () => {
  beforeAll(async () => {
    await loadESFixtures(ES_FIXTURES);
    await loadMongoFixtures(MONGO_FIXTURES);
  });

  afterAll(async () => {
    await unloadESFixtures(ES_FIXTURES);
    await unloadMongoFixtures(MONGO_FIXTURES);
  });

  it('connects reply and paragraph', async () => {
    const ids = { replyId: 'r1', paragraphId: 'p2' };

    const { errors, data } = await gql`
      mutation($replyId: String!, $paragraphId: String!) {
        connectReplyWithParagraph(
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
      userPromise: Promise.resolve({ iss: 'user-id' }),
    });

    expect(errors).toBeUndefined();
    expect(data.connectReplyWithParagraph).toMatchSnapshot();

    // cleanup
    const { db } = await mongoClient;
    await db
      .collection('paragraphReplies')
      .deleteOne({ replyId: 'r1', paragraphId: 'p2' });
  });

  // it('cannot connect already connected reply and paragraph', async () => {});

  // it('blocks non-logged in users', async () => {});
});

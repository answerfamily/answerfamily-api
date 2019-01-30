jest.mock('../dataloaders/auth0UserLoaderFactory');
jest.mock('../lib/scrapUrls');

const { ObjectId } = require('mongodb');
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

const esClient = require('../lib/esClient');
const mongoClient = require('../lib/mongoClient');
const scrapUrls = require('../lib/scrapUrls');

describe('addReplyToParagraph', () => {
  beforeAll(async () => {
    await loadESFixtures(ES_FIXTURES);
    await loadMongoFixtures(MONGO_FIXTURES);
  });

  afterAll(async () => {
    await unloadESFixtures(ES_FIXTURES);
    await unloadMongoFixtures(MONGO_FIXTURES);
  });

  it('creates reply and paragraphReplies', async () => {
    scrapUrls.mockImplementation(() => Promise.resolve({}));
    const reply = {
      text: '明年五月台灣將成為亞洲第一個同性可合法結婚的國家',
      note: 'notenote',
    };

    const { errors, data } = await gql`
      mutation($paragraphId: String!, $reply: ReplyInput!) {
        addReplyToParagraph(paragraphId: $paragraphId, reply: $reply) {
          paragraphReplies {
            id
            reply {
              text
              note
              user {
                id
              }
            }
            user {
              id
            }
          }
        }
      }
    `(
      {
        paragraphId: 'p1',
        reply,
      },
      {
        userPromise: Promise.resolve({ iss: 'user-id' }),
      }
    );

    expect(errors).toBeUndefined();
    expect(
      // ID is random, thus exclude from snapshot
      // eslint-disable-next-line no-unused-vars
      data.addReplyToParagraph.paragraphReplies.map(({ id, ...data }) => data)
    ).toMatchSnapshot();
    expect(scrapUrls.mock.calls).toMatchSnapshot('scrapUrl calls');

    const newParagraphReply = data.addReplyToParagraph.paragraphReplies.find(
      p => p.reply.text === reply.text
    );

    // cleanup
    const { db } = await mongoClient;
    await esClient.deleteByQuery({
      index: 'replies',
      type: '_doc',
      body: {
        query: {
          term: {
            text: reply.text,
          },
        },
      },
    });
    await db
      .collection('paragraphReplies')
      .deleteOne({ _id: ObjectId(newParagraphReply.id) });
  });

  it('blocks non-logged in users', async () => {
    const { errors } = await gql`
      mutation($paragraphId: String!, $reply: ReplyInput!) {
        addReplyToParagraph(paragraphId: $paragraphId, reply: $reply) {
          id
        }
      }
    `({
      paragraphId: 'p1',
      reply: { text: 'foo' },
    });

    // Should be unauthorzied
    expect(errors).toMatchSnapshot();
  });
});

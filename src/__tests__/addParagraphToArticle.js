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
const esClient = require('../lib/esClient');
const mongoClient = require('../lib/mongoClient');

describe('addParagraphToArticle', () => {
  beforeAll(async () => {
    await loadESFixtures(ES_FIXTURES);
    await loadMongoFixtures(MONGO_FIXTURES);
  });

  afterAll(async () => {
    await unloadESFixtures(ES_FIXTURES);
    await unloadMongoFixtures(MONGO_FIXTURES);
  });

  it('creates paragraph and paragraphReplies', async () => {
    const text = '明年五月台灣將成為亞洲第一個同性可合法結婚的國家';

    const { errors, data } = await gql`
      mutation($articleId: String!, $paragraph: ParagraphInput!) {
        addParagraphToArticle(articleId: $articleId, paragraph: $paragraph) {
          paragraphs {
            id
            text
            user {
              id
            }
            paragraphReplies {
              reply {
                id
              }
            }
          }
        }
      }
    `(
      {
        articleId: 'article1',
        paragraph: { text, replyIds: ['r1'] },
      },
      {
        userPromise: Promise.resolve({ iss: 'user-id' }),
      }
    );

    expect(errors).toBeUndefined();
    expect(
      // ID is random, thus exclude from snapshot
      // eslint-disable-next-line no-unused-vars
      data.addParagraphToArticle.paragraphs.map(({ id, ...data }) => data)
    ).toMatchSnapshot();

    const newParagraph = data.addParagraphToArticle.paragraphs.find(
      p => p.text === text
    );

    // cleanup
    const { db } = await mongoClient;
    await esClient.delete({
      index: 'paragraphs',
      type: '_doc',
      id: newParagraph.id,
    });
    await db
      .collection('paragraphReplies')
      .deleteMany({ paragraphId: newParagraph.id });
  });

  it('blocks non-logged in users', async () => {
    const { errors } = await gql`
      mutation($articleId: String!, $paragraph: ParagraphInput!) {
        addParagraphToArticle(articleId: $articleId, paragraph: $paragraph) {
          paragraphs {
            id
          }
        }
      }
    `({
      articleId: 'article1',
      paragraph: { text: 'haha', replyIds: ['r1'] },
    });

    // Should be unauthorzied
    expect(errors).toMatchSnapshot();
  });
});

jest.mock('../dataloaders/auth0UserLoaderFactory');

const gql = require('../../test/gql');
const esClient = require('../lib/esClient');
const mongoClient = require('../lib/mongoClient');

describe('createArticle', () => {
  it('connects reply and paragraph', async () => {
    const article = {
      text: '新文章ㄛ',
      paragraphs: [{ text: '新聞' }],
      sources: [{ url: 'http://google.com', note: '真的' }],
    };

    const { errors, data } = await gql`
      mutation($article: ArticleInput!) {
        createArticle(article: $article) {
          id
          text
          paragraphs {
            text
            user {
              id
            }
          }
          sources {
            url
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
    `(
      { article },
      {
        userPromise: Promise.resolve({ iss: 'user-id' }),
      }
    );

    expect(errors).toBeUndefined();

    const {
      // eslint-disable-next-line no-unused-vars
      createArticle: { id, ...newArticleData },
    } = data;
    expect(newArticleData).toMatchSnapshot();

    // cleanup
    await esClient.deleteByQuery({
      index: '*',
      body: {
        query: {
          match_all: {},
        },
      },
    });

    const { db } = await mongoClient;
    await db.collection('articleSources').remove();
  });

  it('blocks non-logged in users', async () => {
    const { errors } = await gql`
      mutation($article: ArticleInput!) {
        createArticle(article: $article) {
          id
          text
          paragraphs {
            text
          }
        }
      }
    `({
      article: { text: 'hahahha' },
    });

    // Should be unauthorzied
    expect(errors).toMatchSnapshot();
  });
});

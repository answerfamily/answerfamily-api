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

describe('Basic object type graph resolving', () => {
  beforeAll(async () => {
    await loadESFixtures(ES_FIXTURES);
    await loadMongoFixtures(MONGO_FIXTURES);
  });

  afterAll(async () => {
    await unloadESFixtures(ES_FIXTURES);
    await unloadMongoFixtures(MONGO_FIXTURES);
  });

  it('loads from article to reply', async () => {
    const { data, errors } = await gql`
      {
        article(id: "article1") {
          text
          paragraphs {
            id
            text
            paragraphReplies {
              id
              reply {
                id
                text
              }
            }
          }
        }
      }
    `();

    expect(errors).toBeUndefined();
    expect(data).toMatchSnapshot();
  });

  it('loads from reply to article', async () => {
    const { data, errors } = await gql`
      {
        reply(id: "r1") {
          paragraphReplies {
            id
            paragraph {
              id
              article {
                id
              }
            }
          }
        }
      }
    `();

    expect(errors).toBeUndefined();
    expect(data).toMatchSnapshot();
  });

  it('loads from paragraph as well', async () => {
    const { data, errors } = await gql`
      {
        paragraph(id: "p1") {
          article {
            id
          }
          paragraphReplies {
            id
            reply {
              id
              text
            }
          }
        }
      }
    `();

    expect(errors).toBeUndefined();
    expect(data).toMatchSnapshot();
  });
});

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

describe('paragraphReplies', () => {
  beforeAll(async () => {
    await loadESFixtures(ES_FIXTURES);
    await loadMongoFixtures(MONGO_FIXTURES);
  });

  afterAll(async () => {
    await unloadESFixtures(ES_FIXTURES);
    await unloadMongoFixtures(MONGO_FIXTURES);
  });

  it('lists unfiltered paragraphReplies', async () => {
    const { data, errors } = await gql`
      {
        paragraphReplies {
          paragraph {
            id
          }
          reply {
            id
          }
        }
      }
    `();

    expect(errors).toBeUndefined();
    expect(data).toMatchSnapshot();
  });

  it('does limiting', async () => {
    const { data, errors } = await gql`
      {
        paragraphReplies(first: 1) {
          paragraph {
            id
          }
          reply {
            id
          }
        }
      }
    `();

    expect(errors).toBeUndefined();
    expect(data).toMatchSnapshot();
  });

  it('does skipping', async () => {
    const { data, errors } = await gql`
      {
        paragraphReplies(skip: 1) {
          paragraph {
            id
          }
          reply {
            id
          }
        }
      }
    `();

    expect(errors).toBeUndefined();
    expect(data).toMatchSnapshot();
  });
});

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

describe('replies', () => {
  beforeAll(async () => {
    await loadESFixtures(ES_FIXTURES);
    await loadMongoFixtures(MONGO_FIXTURES);
  });

  afterAll(async () => {
    await unloadESFixtures(ES_FIXTURES);
    await unloadMongoFixtures(MONGO_FIXTURES);
  });

  it('lists unfiltered replies', async () => {
    const { data, errors } = await gql`
      {
        replies {
          id
          text
        }
      }
    `();

    expect(errors).toBeUndefined();
    expect(data).toMatchSnapshot();
  });

  it('does limiting', async () => {
    const { data, errors } = await gql`
      {
        replies(first: 1) {
          id
          text
        }
      }
    `();

    expect(errors).toBeUndefined();
    expect(data).toMatchSnapshot();
  });

  it('does skipping', async () => {
    const { data, errors } = await gql`
      {
        replies(skip: 1) {
          id
          text
        }
      }
    `();

    expect(errors).toBeUndefined();
    expect(data).toMatchSnapshot();
  });

  it('does sorting', async () => {
    const { data, errors } = await gql`
      {
        replies(sort: [{ by: createdAt, order: ASC }]) {
          id
          text
        }
      }
    `();

    expect(errors).toBeUndefined();
    expect(data).toMatchSnapshot();
  });

  it('does filtering', async () => {
    const { data, errors } = await gql`
      {
        replies(filter: { contain: "保守團體的打壓 國小的課本" }) {
          id
          text
        }
      }
    `();

    expect(errors).toBeUndefined();
    expect(data).toMatchSnapshot();
  });
});

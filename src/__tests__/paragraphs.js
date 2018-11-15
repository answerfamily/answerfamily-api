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

describe('paragraphs', () => {
  beforeAll(async () => {
    await loadESFixtures(ES_FIXTURES);
    await loadMongoFixtures(MONGO_FIXTURES);
  });

  afterAll(async () => {
    await unloadESFixtures(ES_FIXTURES);
    await unloadMongoFixtures(MONGO_FIXTURES);
  });

  it('lists unfiltered paragraphs', async () => {
    const { data, errors } = await gql`
      {
        paragraphs {
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
        paragraphs(first: 1) {
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
        paragraphs(skip: 1) {
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
        paragraphs(sort: [{ by: createdAt, order: ASC }]) {
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
        paragraphs(
          filter: {
            inText: "哇哇哇哇哇哇哇哇 國中小實施同志教育 會變成合法 外國同性戀來台灣治療愛滋 全民買單 哇啦哇啦哇啦"
            contain: "愛滋"
          }
        ) {
          id
          text
        }
      }
    `();

    expect(errors).toBeUndefined();
    expect(data).toMatchSnapshot();
  });
});

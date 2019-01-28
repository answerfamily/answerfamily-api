jest.mock('graphql-request');
const { request } = require('graphql-request');
const MockDate = require('mockdate'); // eslint-disable-line node/no-unpublished-require

const {
  loadMongoFixtures,
  unloadMongoFixtures,
} = require('../../../test/fixtures');
const { MONGO_FIXTURES } = require('../__fixtures__/scrapUrls');
const scrapUrls = require('../scrapUrls');
const DataLoaders = require('../../dataloaders');
const client = require('../mongoClient');

describe('scrapping & storage', () => {
  afterAll(async () => {
    const { db } = await client;
    // Cleanup
    await db.collection('urlFetchRecords').deleteMany();
  });

  it(
    'scraps from Internet and handles error',
    async () => {
      MockDate.set(1485593157011);
      const { db } = await client;

      // Clear all urlFetchRecords to avoid interference
      await db.collection('urlFetchRecords').deleteMany();

      request.mockReturnValueOnce(
        Promise.resolve({
          resolvedUrls: [
            {
              url: 'http://example.com/index.html',
              canonical: 'http://example.com/index.html',
              title: 'Some title',
              summary: 'Some text as summary',
              topImageUrl: '',
              html: '<html><head></head><body>Hello world</body></html>',
              status: 200,
            },
            {
              url: 'http://example.com/not-found',
              canonical: 'http://example.com/not-found',
              title: '',
              summary: 'Not Found',
              topImageUrl: '',
              html: '<html><head></head><body>Not Found</body></html>',
              status: 404,
            },
          ],
        })
      );

      const [foundResult, notFoundResult] = await scrapUrls(
        `
          This should work: http://example.com/index.html
          This should be not found: http://example.com/not-found
          This should not match: http://malformedUrl:100000
        `,
        { client }
      );
      MockDate.reset();

      expect(request).toMatchSnapshot('GraphQL requests');

      expect(foundResult).toMatchSnapshot('foundResult');
      expect(notFoundResult).toMatchSnapshot('notFoundResult');

      const result = await db
        .collection('urlFetchRecords')
        .find()
        .toArray();

      expect(
        result.map(
          // eslint-disable-next-line no-unused-vars
          ({ _id, ...doc }) => doc
        )
      ).toMatchSnapshot('Docs stored to urls index');
    },
    30000
  );
});

describe('caching', () => {
  beforeAll(() => loadMongoFixtures(MONGO_FIXTURES));
  afterAll(() => unloadMongoFixtures(MONGO_FIXTURES));

  it('fetches latest fetch from urls', async () => {
    const loaders = new DataLoaders();
    expect(
      await scrapUrls(
        `
          http://example.com/article/1111-aaaaa-bbb-ccc // full URL
          http://example.com/article/1111 // canonical URL
        `,
        {
          cacheLoader: loaders.latestUrlFetchRecordByUrlLoader,
          noFetch: true,
        }
      )
    ).toMatchSnapshot();
  });
});

require('../../src/lib/catchUnhandledRejection');
const esClient = require('../../src/lib/esClient');

const SCHEMA = {
  articles: {
    text: { type: 'text', analyzer: 'cjk_url_email' },
    createdAt: { type: 'date' },
    userId: { type: 'keyword' },
  },
  paragraphs: {
    articleId: { type: 'keyword' },
    text: { type: 'text', analyzer: 'cjk_url_email' },
    createdAt: { type: 'date' },
    userId: { type: 'keyword' },
  },
  replies: {
    text: { type: 'text', analyzer: 'cjk_url_email' },

    // Note for other editors
    note: { type: 'text', analyzer: 'cjk_url_email' },

    createdAt: { type: 'date' },
    userId: { type: 'keyword' },
  },
};

Promise.all([
  esClient.indices.putTemplate({
    name: 'shard_settings',
    body: {
      index_patterns: '*',
      settings: {
        number_of_shards: 1,
      },
    },
  }),
  esClient.indices.putTemplate({
    name: 'cjk_analyzers',
    body: {
      index_patterns: '*',
      settings: {
        index: {
          analysis: {
            filter: {
              english_stop: {
                type: 'stop',
                stopwords: '_english_',
              },
            },
            analyzer: {
              cjk_url_email: {
                tokenizer: 'uax_url_email',
                filter: [
                  'cjk_width',
                  'lowercase',
                  'cjk_bigram',
                  'english_stop',
                ],
              },
            },
          },
        },
      },
    },
  }),
]).then(() => {
  Object.keys(SCHEMA).forEach(index => {
    esClient.indices
      .create({
        index,
        body: {
          mappings: { _doc: { properties: SCHEMA[index] } },
        },
      })
      .then(() => {
        // eslint-disable-next-line no-console
        console.log(`Index "${index}" created with mappings`);
      });
  });
});

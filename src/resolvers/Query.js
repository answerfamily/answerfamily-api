const mongoClient = require('../lib/mongoClient');
const scrapUrls = require('../lib/scrapUrls');

const Query = {
  article(_, { id }, { loaders }) {
    return loaders.docLoader.load({ index: 'articles', id });
  },

  reply(_, { id }, { loaders }) {
    return loaders.docLoader.load({ index: 'replies', id });
  },

  paragraph(_, { id }, { loaders }) {
    return loaders.docLoader.load({ index: 'paragraphs', id });
  },

  articles(_, args, { loaders }) {
    return resolveSearchForIndex('articles', args, loaders);
  },

  paragraphs(_, args, { loaders }) {
    return resolveSearchForIndex('paragraphs', args, loaders);
  },

  replies(_, args, { loaders }) {
    return resolveSearchForIndex('replies', args, loaders);
  },

  hyperlinks(_, { inText }, { loaders }) {
    return scrapUrls(inText, {
      cacheLoader: loaders.latestUrlFetchRecordByUrlLoader,
      client: mongoClient,
    });
  },

  async paragraphReplies(_, { first = 10, skip = 0 }) {
    const { db } = await mongoClient;

    return db
      .collection('paragraphReplies')
      .find()
      .sort({ createdAt: -1 })
      .limit(first)
      .skip(skip)
      .toArray();
  },

  me(_, args, { userPromise }) {
    return userPromise;
  },
};

/**
 *
 * @param {string} index
 * @param {object} args
 * @param {object} loaders
 */
async function resolveSearchForIndex(index, args, loaders) {
  const body = {
    query: { match_all: {} },
    size: args.first || 25,
    from: args.skip || 0,
    sort: (args.sort || []).map(({ by, order }) => ({
      [by]: { order: (order || 'DESC').toLowerCase() },
    })),
  };

  if (args.filter) {
    const must = [];

    if (args.filter.inText) {
      const urlFetchRecords = await scrapUrls(args.filter.inText, {
        cacheLoader: loaders.latestUrlFetchRecordByUrlLoader,
        client: mongoClient,
      });

      must.push({
        more_like_this: {
          fields: ['text'],
          like: [args.filter.inText].concat(
            urlFetchRecords.map(r => r.title),
            urlFetchRecords.map(r => r.summary)
          ),
          min_term_freq: 1,
          min_doc_freq: 1,
          max_query_terms: 25,

          // When inText is used, query is large but documents are small.
          // for minimum_should_match we should cater to document length.
          minimum_should_match: 2,
        },
      });
    }

    if (args.filter.contain) {
      must.push({
        simple_query_string: {
          query: args.filter.contain,
          fields: ['text'],
        },
      });
    }

    body.query = { bool: { must } };
  }
  return loaders.searchResultLoader.load({ index, body });
}

module.exports = Query;

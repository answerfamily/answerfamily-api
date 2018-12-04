const mongoClient = require('../lib/mongoClient');

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
    return resolveSearchForIndex('articles', args, loaders.searchResultLoader);
  },

  paragraphs(_, args, { loaders }) {
    return resolveSearchForIndex(
      'paragraphs',
      args,
      loaders.searchResultLoader
    );
  },

  replies(_, args, { loaders }) {
    return resolveSearchForIndex('replies', args, loaders.searchResultLoader);
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
 * @param {object} searchResultLoader
 */
function resolveSearchForIndex(index, args, searchResultLoader) {
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
      must.push({
        more_like_this: {
          fields: ['text'],
          like: args.filter.inText,
          min_term_freq: 1,
          min_doc_freq: 1,
          max_query_terms: 25,
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
  return searchResultLoader.load({ index, body });
}

module.exports = Query;

const scrapUrls = require('../lib/scrapUrls');

module.exports = {
  paragraphs({ id }, _, { loaders }) {
    // searchResultLoader always return arrays
    return loaders.searchResultLoader.load({
      index: 'paragraphs',
      body: {
        query: {
          term: {
            articleId: id,
          },
        },
      },
    });
  },
  async sources({ id }, _, { loaders }) {
    const result = await loaders.articleSourcesLoader.load(id);
    return result || [];
  },

  user({ userId }, _, { loaders }) {
    return loaders.auth0UserLoader.load(userId);
  },

  hyperlinks({ text }, _, { loaders }) {
    return scrapUrls(text, {
      cacheLoader: loaders.latestUrlFetchRecordByUrlLoader,
      noFetch: true,
    });
  },
};

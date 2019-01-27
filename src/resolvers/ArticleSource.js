const scrapUrls = require('../lib/scrapUrls');

module.exports = {
  id({ _id }) {
    return _id;
  },

  article({ articleId }, _, { loaders }) {
    return loaders.docLoader.load({
      index: 'articles',
      id: articleId,
    });
  },

  user({ userId }, _, { loaders }) {
    return loaders.auth0UserLoader.load(userId);
  },

  async canDelete({ userId }, _, { userPromise }) {
    const user = await userPromise;

    return user && user.iss === userId;
  },

  async hyperlink({ url }, _, { loaders }) {
    const urlFetchResults = await scrapUrls(url, {
      cacheLoader: loaders.latestUrlFetchRecordByUrlLoader,
      noFetch: true,
    });

    if (urlFetchResults) return urlFetchResults[0];

    return null;
  },
};

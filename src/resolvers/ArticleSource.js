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

  hyperlink({ url }, _, { loaders }) {
    return loaders.latestUrlFetchRecordByUrlLoader.load(url);
  },
};

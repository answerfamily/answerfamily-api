module.exports = {
  paragraph({ paragraphId }, _, { loaders }) {
    return loaders.docLoader.load({
      index: 'paragraphs',
      id: paragraphId,
    });
  },

  reply({ replyId }, _, { loaders }) {
    return loaders.docLoader.load({
      index: 'replies',
      id: replyId,
    });
  },

  user({ userId }, _, { loaders }) {
    return loaders.auth0UserLoader.load(userId);
  },

  async canDelete({ userId }, _, { userPromise }) {
    const user = await userPromise;

    return user && user.iss === userId;
  },
};

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
};

module.exports = {
  article({ articleId }, _, { loaders }) {
    return loaders.docLoader.load({
      index: 'articles',
      id: articleId,
    });
  },
  async paragraphReplies({ id }, _, { loaders }) {
    const result = await loaders.paragraphRepliesByParagraphIdLoader.load(id);
    return result || [];
  },
  user({ userId }, _, { loaders }) {
    return loaders.auth0UserLoader.load(userId);
  },
};

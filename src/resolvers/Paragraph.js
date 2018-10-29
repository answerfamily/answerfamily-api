module.exports = {
  article({ articleId }, _, { loaders }) {
    return loaders.docLoader.load({
      index: 'articles',
      id: articleId,
    });
  },
  paragraphReplies({ id }, _, { loaders }) {
    return loaders.paragraphRepliesByParagraphIdLoader.load(id);
  },
};

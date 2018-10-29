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
};

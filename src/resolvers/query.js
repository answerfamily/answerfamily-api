module.exports = {
  article(_, { id }, { loaders }) {
    return loaders.docLoader.load({ index: 'articles', id });
  },

  reply(_, { id }, { loaders }) {
    return loaders.docLoader.load({ index: 'replies', id });
  },

  paragraph(_, { id }, { loaders }) {
    return loaders.docLoader.load({ index: 'paragraphs', id });
  },
};

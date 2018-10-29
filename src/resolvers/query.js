module.exports = {
  ping() {
    return 'Hello world!';
  },

  article(_, { id }, { loaders }) {
    return loaders.docLoader.load({ index: 'articles', id });
  },
};

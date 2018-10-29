module.exports = {
  paragraphs({ id }, _, { loaders }) {
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
};
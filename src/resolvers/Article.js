module.exports = {
  paragraphs({ id }, _, { loaders }) {
    // searchResultLoader always return arrays
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
  async sources({ id }, _, { loaders }) {
    const result = await loaders.articleSourcesLoader.load(id);
    return result || [];
  },
};
